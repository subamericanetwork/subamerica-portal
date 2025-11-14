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
      .order('viewer_count', { ascending: false });

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
      duration_minutes: stream.duration_minutes
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