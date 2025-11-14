import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { 
      stream_id, 
      track_title, 
      track_description, 
      thumbnail_url, 
      playlist_ids,
      media_type 
    } = await req.json();

    // Get stream data
    const { data: stream } = await supabase
      .from('artist_live_streams')
      .select('*, artists!inner(user_id)')
      .eq('id', stream_id)
      .single();

    if (!stream) {
      throw new Error('Stream not found');
    }

    if (stream.artists.user_id !== user.id) {
      throw new Error('Unauthorized');
    }

    if (!stream.cloudinary_vod_url) {
      return new Response(
        JSON.stringify({ error: 'Recording not ready yet' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create new track entry (no trimming, publish as-is)
    const tableName = media_type === 'video' ? 'videos' : 'audio_tracks';
    const mediaField = media_type === 'video' ? 'video_url' : 'audio_url';

    const { data: track } = await supabase
      .from(tableName)
      .insert({
        artist_id: stream.artist_id,
        title: track_title,
        description: track_description,
        [mediaField]: stream.cloudinary_vod_url,
        thumb_url: thumbnail_url || stream.thumbnail_url,
        cloudinary_public_id: stream.cloudinary_public_id,
        cloudinary_resource_type: 'video',
        source_type: 'live_stream',
        source_stream_id: stream_id,
        duration: stream.duration_minutes * 60,
        status: 'published',
        moderation_status: 'approved'
      })
      .select()
      .single();

    // Mark stream as converted
    await supabase
      .from('artist_live_streams')
      .update({
        converted_to_track: true,
        converted_track_id: track.id
      })
      .eq('id', stream_id);

    // Add to playlists if specified
    if (playlist_ids && playlist_ids.length > 0) {
      for (const playlistId of playlist_ids) {
        if (media_type === 'video') {
          const { data: playlist } = await supabase
            .from('stream_playlists')
            .select('video_ids')
            .eq('id', playlistId)
            .single();

          if (playlist) {
            const currentIds = playlist.video_ids || [];
            await supabase
              .from('stream_playlists')
              .update({
                video_ids: [...currentIds, track.id]
              })
              .eq('id', playlistId);
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        track_id: track.id,
        track_url: media_type === 'video' ? `/watch/${track.id}` : `/audio/${track.id}`
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Convert Stream to Track] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});