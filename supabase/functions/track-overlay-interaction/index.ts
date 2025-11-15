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

    const { overlay_id, stream_id, interaction_type, platform, session_id, user_id } = await req.json();

    console.log('Tracking overlay interaction:', {
      overlay_id,
      stream_id,
      interaction_type,
      platform,
      session_id: session_id?.substring(0, 8) + '...'
    });

    // Insert interaction record
    const { data, error } = await supabase
      .from('stream_overlay_interactions')
      .insert({
        overlay_id,
        stream_id,
        user_id: user_id || null,
        interaction_type,
        platform,
        session_id
      })
      .select()
      .single();

    if (error) {
      console.error('Error tracking interaction:', error);
      throw error;
    }

    console.log('Interaction tracked successfully:', data.id);

    return new Response(
      JSON.stringify({ success: true, interaction_id: data.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in track-overlay-interaction:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});