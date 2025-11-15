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
    const CLOUDINARY_CLOUD_NAME = Deno.env.get('CLOUDINARY_CLOUD_NAME');
    const CLOUDINARY_API_KEY = Deno.env.get('CLOUDINARY_API_KEY');
    const CLOUDINARY_API_SECRET = Deno.env.get('CLOUDINARY_API_SECRET');

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    
    const event = await req.json();
    console.log('[Livepush Webhook] Event type:', event.type);

    switch (event.type) {
      case 'stream.started': {
        console.log('[Livepush Webhook] Stream started:', event.stream_id);
        await supabase
          .from('artist_live_streams')
          .update({
            status: 'live',
            started_at: new Date().toISOString()
          })
          .eq('livepush_stream_id', event.stream_id);
        break;
      }

      case 'stream.ended': {
        console.log('[Livepush Webhook] Stream ended:', event.stream_id);
        const { data: stream } = await supabase
          .from('artist_live_streams')
          .update({
            status: 'ended',
            ended_at: new Date().toISOString()
          })
          .eq('livepush_stream_id', event.stream_id)
          .select()
          .single();

        if (stream && stream.started_at) {
          // Calculate duration
          const durationMs = new Date(stream.ended_at).getTime() - new Date(stream.started_at).getTime();
          const durationMinutes = Math.ceil(durationMs / (1000 * 60));

          await supabase
            .from('artist_live_streams')
            .update({ duration_minutes: durationMinutes })
            .eq('id', stream.id);

          // Only deduct minutes for subamerica_managed streams
          if (stream.streaming_mode === 'subamerica_managed') {
            await supabase.rpc('deduct_streaming_minutes', {
              p_artist_id: stream.artist_id,
              p_minutes_used: durationMinutes
            });

            console.log('[Livepush Webhook] Deducted', durationMinutes, 'minutes from artist', stream.artist_id);
          } else {
            console.log('[Livepush Webhook] Skipping minute deduction for own_account stream');
          }
        }
        break;
      }

      case 'stream.recording_ready': {
        console.log('[Livepush Webhook] Recording ready:', event.stream_id, event.recording_url);
        
        // Download recording from Livepush
        const recordingResponse = await fetch(event.recording_url);
        if (!recordingResponse.ok) {
          throw new Error('Failed to download recording');
        }
        const recordingBlob = await recordingResponse.blob();
        const recordingArrayBuffer = await recordingBlob.arrayBuffer();

        // Upload to Cloudinary
        const formData = new FormData();
        formData.append('file', new Blob([recordingArrayBuffer]));
        formData.append('upload_preset', 'live_recordings');
        formData.append('resource_type', 'video');

        const cloudinaryResponse = await fetch(
          `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/video/upload`,
          { method: 'POST', body: formData }
        );

        if (!cloudinaryResponse.ok) {
          throw new Error('Failed to upload to Cloudinary');
        }

        const cloudinaryData = await cloudinaryResponse.json();

        // Update stream with Cloudinary URL
        await supabase
          .from('artist_live_streams')
          .update({
            cloudinary_vod_url: cloudinaryData.secure_url,
            cloudinary_public_id: cloudinaryData.public_id
          })
          .eq('livepush_stream_id', event.stream_id);

        console.log('[Livepush Webhook] Uploaded recording to Cloudinary:', cloudinaryData.public_id);
        break;
      }

      case 'stream.viewer_update': {
        await supabase
          .from('artist_live_streams')
          .update({
            viewer_count: event.current_viewers,
            peak_viewers: event.peak_viewers
          })
          .eq('livepush_stream_id', event.stream_id);
        break;
      }

      default:
        console.log('[Livepush Webhook] Unhandled event type:', event.type);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[Livepush Webhook] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});