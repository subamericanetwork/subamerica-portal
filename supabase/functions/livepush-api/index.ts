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

    // Get stored admin access token from database
    const getAdminAccessToken = async () => {
      // For now, we'll get the admin user's token from environment or a special admin tokens table
      // This requires you to authorize the app first and store your token
      const ADMIN_LIVEPUSH_TOKEN = Deno.env.get('LIVEPUSH_ADMIN_TOKEN');
      
      if (!ADMIN_LIVEPUSH_TOKEN) {
        throw new Error('Admin Livepush token not configured. Please authorize the application first.');
      }
      
      return ADMIN_LIVEPUSH_TOKEN;
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
          sync_error: null,
        }, { onConflict: 'video_id' })
        .select()
        .single();

      if (insertError) {
        console.error('Insert error:', insertError);
        throw insertError;
      }

      // Get admin access token
      let accessToken;
      try {
        accessToken = await getAdminAccessToken();
      } catch (tokenError) {
        await supabase
          .from('livepush_videos')
          .update({
            sync_status: 'failed',
            sync_error: 'Admin authorization required. Please contact administrator.',
          })
          .eq('id', livepushVideo.id);
        throw tokenError;
      }

      // Get the artist's Livepush stream ID from their permissions
      const { data: permissions } = await supabase
        .from('livepush_artist_permissions')
        .select('livepush_stream_id')
        .eq('artist_id', artistId)
        .single();

      if (!permissions?.livepush_stream_id) {
        await supabase
          .from('livepush_videos')
          .update({
            sync_status: 'failed',
            sync_error: 'No Livepush stream ID configured. Please set up your Livepush stream first.',
          })
          .eq('id', livepushVideo.id);

        throw new Error('No Livepush stream ID configured');
      }

      // Upload video directly to the artist's stream video library
      const uploadResponse = await fetch(`https://octopus.livepush.io/streams/${permissions.livepush_stream_id}/videos`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: video.title,
          source: {
            type: 'url',
            url: video.video_url,
          },
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

      const uploadData = await uploadResponse.json();

      // Update with Livepush data
      const { data: updatedVideo } = await supabase
        .from('livepush_videos')
        .update({
          livepush_id: uploadData.id,
          livepush_url: uploadData.playbackUrl || uploadData.url,
          sync_status: 'synced',
          last_synced_at: new Date().toISOString(),
        })
        .eq('id', livepushVideo.id)
        .select()
        .single();

      console.log(`Video synced to Livepush library: ${uploadData.id}`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          livepushVideo: updatedVideo,
          uploadData
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

    // CREATE LIVE STREAM
    if (action === 'create-live-stream' && req.method === 'POST') {
      const { title, description, artistId, scheduledStart } = requestBody;

      console.log(`Creating live stream for artist ${artistId}`);

      // Get artist data
      const { data: artist } = await supabase
        .from('artists')
        .select('subscription_tier, streaming_minutes_used, streaming_minutes_included')
        .eq('id', artistId)
        .eq('user_id', user.id)
        .single();

      if (!artist) {
        throw new Error('Unauthorized');
      }

      // Check if user is admin
      const { data: isAdmin } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'admin'
      });
      
      console.log(`User ${user.id} admin status: ${isAdmin}`);

      // Check if artist is Trident tier (skip for admins)
      if (!isAdmin && artist.subscription_tier !== 'trident') {
        return new Response(
          JSON.stringify({
            error: 'upgrade_required',
            message: 'Upgrade to Trident to go live!',
            discount: {
              code: 'GOLIVE50',
              description: '50% off first month',
              price: 49.50
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
        );
      }

      // Calculate minutes remaining
      const minutesRemaining = isAdmin 
        ? 999999 
        : artist.streaming_minutes_included - artist.streaming_minutes_used;

      // Check if artist has minutes remaining (skip for admins)
      if (!isAdmin && minutesRemaining <= 0) {
        return new Response(
          JSON.stringify({
            error: 'no_minutes',
            message: 'You\'ve used all 10 hours this month',
            action: 'purchase',
            price: 15.00,
            per: '1 hour'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
        );
      }

      if (isAdmin) {
        console.log('✅ Admin user - bypassing subscription checks');
      }

      // Generate unique RTMP stream key
      const streamKey = crypto.randomUUID();
      const rtmpUrl = `rtmp://rtmp.livepush.io/live/${streamKey}`;

      // Get admin access token
      const accessToken = await getAdminAccessToken();

      // Create Livepush stream
      const livepushResponse = await fetch('https://octopus.livepush.io/streams', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: title,
          description: description || '',
          category: 'music',
          ingest: { rtmp: rtmpUrl },
          transcode: { hls: true, resolution: '1080p' },
          record: true
        }),
      });

      if (!livepushResponse.ok) {
        const errorText = await livepushResponse.text();
        console.error('Livepush stream creation error:', errorText);
        throw new Error(`Failed to create stream: ${errorText}`);
      }

      const livepushStream = await livepushResponse.json();

      // Store in database
      const { data: stream } = await supabase
        .from('artist_live_streams')
        .insert({
          artist_id: artistId,
          user_id: user.id,
          title,
          description,
          stream_key: streamKey,
          rtmp_ingest_url: rtmpUrl,
          livepush_stream_id: livepushStream.id,
          hls_playback_url: livepushStream.playback_url,
          status: scheduledStart ? 'scheduled' : 'ready',
          scheduled_start: scheduledStart || null
        })
        .select()
        .single();

      console.log(`Live stream created: ${stream.id}`);

      return new Response(
        JSON.stringify({ 
          success: true,
          stream_id: stream.id,
          rtmp_url: rtmpUrl,
          stream_key: streamKey,
          hls_url: livepushStream.playback_url,
          status: stream.status,
          minutes_remaining: minutesRemaining
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // END LIVE STREAM
    if (action === 'end-stream' && req.method === 'POST') {
      const { streamId } = requestBody;

      const { data: stream } = await supabase
        .from('artist_live_streams')
        .select('*, artists!inner(user_id)')
        .eq('id', streamId)
        .single();

      if (!stream || stream.artists.user_id !== user.id) {
        throw new Error('Unauthorized');
      }

      // Update stream status
      const { data: updatedStream } = await supabase
        .from('artist_live_streams')
        .update({
          status: 'ended',
          ended_at: new Date().toISOString()
        })
        .eq('id', streamId)
        .select()
        .single();

      // Calculate duration and deduct minutes
      if (updatedStream.started_at) {
        const durationMs = new Date(updatedStream.ended_at).getTime() - new Date(updatedStream.started_at).getTime();
        const durationMinutes = Math.ceil(durationMs / (1000 * 60));

        await supabase
          .from('artist_live_streams')
          .update({ duration_minutes: durationMinutes })
          .eq('id', streamId);

        await supabase.rpc('deduct_streaming_minutes', {
          p_artist_id: stream.artist_id,
          p_minutes_used: durationMinutes
        });

        return new Response(
          JSON.stringify({ success: true, duration_minutes: durationMinutes }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true }),
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

      // Get admin access token
      const accessToken = await getAdminAccessToken();

      // Create stream on Livepush
      const streamResponse = await fetch('https://octopus.livepush.io/streams', {
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
