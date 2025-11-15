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
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_PUBLISHABLE_KEY');

    const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!);

    // Get all currently live streams
    const { data: liveStreams } = await supabase
      .from('artist_live_streams')
      .select(`
        id,
        title,
        description,
        thumbnail_url,
        hls_playback_url,
        started_at,
        duration_minutes,
        viewer_count,
        artist_id,
        artists!inner(display_name, slug)
      `)
      .eq('status', 'live')
      .eq('show_on_tv', true)
      .order('viewer_count', { ascending: false });

    // Fetch overlays for all live streams
    const streamIds = (liveStreams || []).map((s: any) => s.id);
    const { data: overlays } = streamIds.length > 0 
      ? await supabase
          .from('stream_overlays')
          .select('*')
          .in('stream_id', streamIds)
          .order('trigger_time_seconds', { ascending: true })
      : { data: [] };

    // Group overlays by stream_id (TV-compatible platforms only)
    const overlaysByStream = (overlays || []).reduce((acc: Record<string, any[]>, overlay: any) => {
      // Only include overlays that target TV platforms
      const tvPlatforms = ['roku', 'firetv', 'appletv', 'android-tv'];
      const hasTvPlatform = overlay.platforms?.some((p: string) => tvPlatforms.includes(p));
      
      if (hasTvPlatform) {
        if (!acc[overlay.stream_id]) {
          acc[overlay.stream_id] = [];
        }
        acc[overlay.stream_id].push({
          id: overlay.id,
          type: overlay.overlay_type,
          trigger_time: overlay.trigger_time_seconds,
          duration: overlay.duration_seconds,
          position: overlay.position,
          data: {
            ...overlay.content_data,
            // Add QR code URL for TV → mobile conversion
            qr_code_url: overlay.overlay_type === 'product' && overlay.content_data?.product_id
              ? `https://subamerica.net/qr/product/${overlay.content_data.product_id}`
              : overlay.click_action?.url || null
          }
        });
      }
      return acc;
    }, {});

    const sources = (liveStreams || []).map((stream: any) => ({
      id: stream.id,
      artist_name: stream.artists.display_name,
      artist_slug: stream.artists.slug,
      title: stream.title,
      description: stream.description,
      hls_url: stream.hls_playback_url,
      thumbnail_url: stream.thumbnail_url,
      started_at: stream.started_at,
      viewers: stream.viewer_count,
      duration_minutes: stream.duration_minutes,
      overlays: overlaysByStream[stream.id] || []
    }));

    return new Response(
      JSON.stringify({ 
        live_sources: sources,
        updated_at: new Date().toISOString()
      }),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'max-age=30'
        } 
      }
    );
  } catch (error) {
    console.error('[TV Live Sources] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});