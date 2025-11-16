import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const muxTokenId = Deno.env.get('MUX_TOKEN_ID')!;
    const muxTokenSecret = Deno.env.get('MUX_TOKEN_SECRET')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const { streamId } = body;

    if (!streamId) {
      return new Response(JSON.stringify({ error: 'Stream ID required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Syncing status for stream:', streamId);

    // Get stream from database
    const { data: stream, error: streamError } = await supabase
      .from('artist_live_streams')
      .select('*')
      .eq('id', streamId)
      .single();

    if (streamError || !stream) {
      console.error('Stream not found:', streamError);
      return new Response(JSON.stringify({ error: 'Stream not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Only sync Mux streams
    if (stream.provider !== 'mux' || !stream.livepush_stream_id) {
      return new Response(JSON.stringify({ 
        message: 'Stream is not a Mux stream, no sync needed',
        stream: { id: stream.id, status: stream.status }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Query Mux API for actual stream status
    const basicAuth = btoa(`${muxTokenId}:${muxTokenSecret}`);
    const muxResponse = await fetch(
      `https://api.mux.com/video/v1/live-streams/${stream.livepush_stream_id}`,
      {
        headers: {
          'Authorization': `Basic ${basicAuth}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!muxResponse.ok) {
      const errorText = await muxResponse.text();
      console.error('Mux API error:', muxResponse.status, errorText);
      return new Response(JSON.stringify({ error: 'Failed to fetch stream from Mux' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const muxData = await muxResponse.json();
    const muxStatus = muxData.data?.status; // 'active', 'idle', etc.
    
    // Get the active playback ID for HLS URL
    const playbackIds = muxData.data?.playback_ids || [];
    const activePlaybackId = playbackIds.find((p: any) => p.policy === 'public')?.id || playbackIds[0]?.id;
    const hlsPlaybackUrl = activePlaybackId ? `https://stream.mux.com/${activePlaybackId}.m3u8` : null;

    console.log(`Stream ${streamId}: Mux status = ${muxStatus}, DB status = ${stream.status}, HLS URL = ${hlsPlaybackUrl}`);

    // Sync database status with Mux status
    let newStatus = stream.status;
    let updateData: any = {};

    if (muxStatus === 'active' && stream.status !== 'live') {
      newStatus = 'live';
      updateData = {
        status: 'live',
        started_at: stream.started_at || new Date().toISOString(),
        hls_playback_url: hlsPlaybackUrl // Update with correct playback URL
      };
      console.log(`🔴 Stream ${streamId} is now LIVE with HLS URL: ${hlsPlaybackUrl}`);
    } else if (muxStatus === 'idle' && stream.status === 'live') {
      const endedAt = new Date();
      const startedAt = stream.started_at ? new Date(stream.started_at) : endedAt;
      const durationMinutes = Math.ceil((endedAt.getTime() - startedAt.getTime()) / 60000);

      newStatus = 'waiting';
      updateData = {
        status: 'waiting',
        ended_at: endedAt.toISOString(),
        duration_minutes: durationMinutes
      };
      console.log(`⚫ Stream ${streamId} has ended`);
    } else if (muxStatus === 'active' && stream.status === 'live') {
      // Verify HLS URL is correct even if already live
      if (hlsPlaybackUrl && stream.hls_playback_url !== hlsPlaybackUrl) {
        updateData = { hls_playback_url: hlsPlaybackUrl };
        console.log(`🔄 Updating HLS URL for stream ${streamId}: ${hlsPlaybackUrl}`);
      } else {
        console.log(`✅ Stream ${streamId} is still live`);
      }
    }

    // Update database if status changed
    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await supabase
        .from('artist_live_streams')
        .update(updateData)
        .eq('id', streamId);

      if (updateError) {
        console.error('Failed to update stream status:', updateError);
        return new Response(JSON.stringify({ error: 'Failed to update stream status' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      console.log('Stream status synced:', stream.status, '->', newStatus);
    }

    return new Response(JSON.stringify({ 
      success: true,
      synced: Object.keys(updateData).length > 0,
      oldStatus: stream.status,
      newStatus: newStatus,
      muxStatus: muxStatus
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error syncing stream status:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
