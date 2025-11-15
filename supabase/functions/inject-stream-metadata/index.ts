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

    const { stream_id } = await req.json();

    console.log('Injecting metadata for stream:', stream_id);

    // Fetch stream details
    const { data: stream, error: streamError } = await supabase
      .from('artist_live_streams')
      .select('*')
      .eq('id', stream_id)
      .single();

    if (streamError || !stream) {
      throw new Error('Stream not found');
    }

    // Fetch overlays for this stream, ordered by trigger time
    const { data: overlays, error: overlaysError } = await supabase
      .from('stream_overlays')
      .select('*')
      .eq('stream_id', stream_id)
      .order('trigger_time_seconds', { ascending: true });

    if (overlaysError) {
      throw overlaysError;
    }

    if (!overlays || overlays.length === 0) {
      console.log('No overlays found for stream');
      return new Response(
        JSON.stringify({ success: true, overlays_count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${overlays.length} overlays to inject`);

    // Format overlays as ID3 metadata
    const metadataPayloads = overlays.map(overlay => ({
      overlay_id: overlay.id,
      type: overlay.overlay_type,
      trigger_time: overlay.trigger_time_seconds,
      duration: overlay.duration_seconds,
      position: overlay.position,
      clickable: overlay.clickable,
      data: overlay.content_data,
      click_action: overlay.click_action,
      platforms: overlay.platforms,
      priority: overlay.priority
    }));

    // For Mux streams, we would inject via Mux API
    // For Livepush streams, we would inject via Livepush API
    // For now, we'll just log and return the formatted data
    // The actual injection will happen during stream playback via client-side parsing

    console.log('Metadata prepared for injection:', metadataPayloads.length, 'overlays');

    return new Response(
      JSON.stringify({ 
        success: true, 
        overlays_count: overlays.length,
        metadata: metadataPayloads
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in inject-stream-metadata:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});