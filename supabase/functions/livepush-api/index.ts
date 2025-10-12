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
    const LIVEPUSH_CLIENT_ID = Deno.env.get('LIVEPUSH_CLIENT_ID');
    const LIVEPUSH_CLIENT_SECRET = Deno.env.get('LIVEPUSH_CLIENT_SECRET');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!LIVEPUSH_CLIENT_ID || !LIVEPUSH_CLIENT_SECRET) {
      throw new Error('Livepush credentials not configured');
    }

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

    // Get action from request body or query params
    let action = null;
    let requestBody: any = {};
    
    if (req.method === 'POST') {
      requestBody = await req.json();
      action = requestBody.action;
    } else {
      const url = new URL(req.url);
      action = url.searchParams.get('action');
    }

    console.log(`Livepush API - Action: ${action}, User: ${user.id}`);

    // Get Livepush access token
    const getAccessToken = async () => {
      const tokenResponse = await fetch('https://api.livepush.io/v1/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          grant_type: 'client_credentials',
          client_id: LIVEPUSH_CLIENT_ID,
          client_secret: LIVEPUSH_CLIENT_SECRET,
        }),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error('Livepush token error:', errorText);
        throw new Error('Failed to get Livepush access token');
      }

      const tokenData = await tokenResponse.json();
      return tokenData.access_token;
    };

    // SYNC VIDEO TO LIVEPUSH
    if (action === 'sync-video' && req.method === 'POST') {
      const { videoId, artistId } = requestBody;

      console.log(`Syncing video ${videoId} for artist ${artistId}`);

      // Get artist data
      const { data: artist } = await supabase
        .from('artists')
        .select('id, user_id')
        .eq('id', artistId)
        .single();

      if (!artist || artist.user_id !== user.id) {
        throw new Error('Unauthorized to sync this video');
      }

      // Get video data
      const { data: video } = await supabase
        .from('videos')
        .select('*')
        .eq('id', videoId)
        .single();

      if (!video) {
        throw new Error('Video not found');
      }

      // Check if already synced
      const { data: existingSync } = await supabase
        .from('livepush_videos')
        .select('*')
        .eq('video_id', videoId)
        .maybeSingle();

      if (existingSync && existingSync.sync_status === 'synced') {
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Video already synced',
            livepushVideo: existingSync 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Create or update livepush_videos record
      const { data: livepushVideo, error: insertError } = await supabase
        .from('livepush_videos')
        .upsert({
          artist_id: artistId,
          video_id: videoId,
          sync_status: 'syncing',
          sync_started_at: new Date().toISOString(),
        }, { onConflict: 'video_id' })
        .select()
        .single();

      if (insertError) {
        console.error('Insert error:', insertError);
        throw insertError;
      }

      // Get access token
      const accessToken = await getAccessToken();

      // Upload video to Livepush
      const uploadResponse = await fetch('https://api.livepush.io/v1/videos', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: video.title,
          description: `Video from SubAmerica: ${video.title}`,
          source_url: video.video_url,
          tags: video.tags || [],
        }),
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('Livepush upload error:', errorText);
        
        await supabase
          .from('livepush_videos')
          .update({
            sync_status: 'failed',
            sync_error: errorText,
          })
          .eq('id', livepushVideo.id);

        throw new Error(`Failed to upload video to Livepush: ${errorText}`);
      }

      const livepushData = await uploadResponse.json();

      // Update with Livepush ID
      const { data: updatedVideo } = await supabase
        .from('livepush_videos')
        .update({
          livepush_id: livepushData.id,
          livepush_url: livepushData.playback_url || livepushData.url,
          sync_status: 'synced',
          last_synced_at: new Date().toISOString(),
        })
        .eq('id', livepushVideo.id)
        .select()
        .single();

      console.log(`Video synced successfully: ${livepushData.id}`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          livepushVideo: updatedVideo,
          livepushData 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // GET SYNC STATUS
    if (action === 'sync-status' && req.method === 'GET') {
      const url = new URL(req.url);
      const videoId = url.searchParams.get('videoId');

      const { data: livepushVideo } = await supabase
        .from('livepush_videos')
        .select('*')
        .eq('video_id', videoId)
        .maybeSingle();

      return new Response(
        JSON.stringify({ success: true, livepushVideo }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // CREATE PLAYLIST STREAM
    if (action === 'create-playlist-stream' && req.method === 'POST') {
      const { playlistId, artistId } = requestBody;

      console.log(`Creating playlist stream ${playlistId} for artist ${artistId}`);

      // Get artist data
      const { data: artist } = await supabase
        .from('artists')
        .select('id, user_id, slug, display_name')
        .eq('id', artistId)
        .single();

      if (!artist || artist.user_id !== user.id) {
        throw new Error('Unauthorized');
      }

      // Get playlist data
      const { data: playlist } = await supabase
        .from('stream_playlists')
        .select('*')
        .eq('id', playlistId)
        .single();

      if (!playlist) {
        throw new Error('Playlist not found');
      }

      // Get access token
      const accessToken = await getAccessToken();

      // Create stream on Livepush
      const streamResponse = await fetch('https://api.livepush.io/v1/streams', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: playlist.name,
          description: playlist.description || `Playlist stream by ${artist.display_name}`,
          type: 'playlist',
          playlist_videos: playlist.video_ids,
          loop: playlist.loop_mode === 'infinite',
        }),
      });

      if (!streamResponse.ok) {
        const errorText = await streamResponse.text();
        console.error('Livepush stream creation error:', errorText);
        throw new Error(`Failed to create stream: ${errorText}`);
      }

      const streamData = await streamResponse.json();

      // Update playlist with stream data
      const { data: updatedPlaylist } = await supabase
        .from('stream_playlists')
        .update({
          livepush_stream_id: streamData.id,
          rtmp_url: streamData.rtmp_url,
          stream_key: streamData.stream_key,
          qr_code_url: `https://${artist.slug}.subamerica.net?action=tip&utm_source=stream`,
          status: 'ready',
        })
        .eq('id', playlistId)
        .select()
        .single();

      console.log(`Playlist stream created: ${streamData.id}`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          playlist: updatedPlaylist,
          streamData 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Invalid action');

  } catch (error) {
    console.error('Livepush API error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
