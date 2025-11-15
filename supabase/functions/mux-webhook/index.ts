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
    const supabase = createClient(supabaseUrl, supabaseKey);

    const event = await req.json();
    console.log('Mux webhook received:', event.type);

    const streamId = event.data?.id;
    if (!streamId) {
      return new Response(JSON.stringify({ error: 'No stream ID in webhook' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Find the stream by livepush_stream_id (we store Mux stream ID here for Mux streams)
    const { data: stream, error: streamError } = await supabase
      .from('artist_live_streams')
      .select('*')
      .eq('livepush_stream_id', streamId)
      .single();

    if (streamError || !stream) {
      console.log('Stream not found for ID:', streamId);
      return new Response(JSON.stringify({ error: 'Stream not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    switch (event.type) {
      case 'video.live_stream.active':
        await supabase
          .from('artist_live_streams')
          .update({
            status: 'live',
            started_at: new Date().toISOString(),
          })
          .eq('id', stream.id);
        console.log('Stream started:', stream.id);
        break;

      case 'video.live_stream.idle':
        const endedAt = new Date();
        const startedAt = new Date(stream.started_at);
        const durationMinutes = Math.ceil((endedAt.getTime() - startedAt.getTime()) / 60000);

        await supabase
          .from('artist_live_streams')
          .update({
            status: 'ended',
            ended_at: endedAt.toISOString(),
            duration_minutes: durationMinutes,
          })
          .eq('id', stream.id);

        // Only deduct minutes for Subamerica Managed streams
        if (stream.streaming_mode === 'subamerica_managed') {
          await supabase.rpc('deduct_streaming_minutes', {
            p_artist_id: stream.artist_id,
            p_minutes_used: durationMinutes,
          });
          console.log('Minutes deducted:', durationMinutes);
        }
        
        console.log('Stream ended:', stream.id);
        break;

      case 'video.asset.ready':
        // Handle recording ready
        if (event.data?.playback_ids && event.data.playback_ids.length > 0) {
          const playbackId = event.data.playback_ids[0].id;
          const vodUrl = `https://stream.mux.com/${playbackId}.m3u8`;

          await supabase
            .from('artist_live_streams')
            .update({
              cloudinary_vod_url: vodUrl,
              cloudinary_public_id: playbackId,
            })
            .eq('livepush_stream_id', streamId);

          console.log('Recording ready:', vodUrl);
        }
        break;

      case 'video.live_stream.updated':
        // Update viewer count if available
        if (event.data?.max_continuous_duration !== undefined) {
          await supabase
            .from('artist_live_streams')
            .update({
              peak_viewers: event.data.max_continuous_duration,
            })
            .eq('id', stream.id);
        }
        break;

      default:
        console.log('Unhandled Mux event type:', event.type);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error processing Mux webhook:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
