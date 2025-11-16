import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const muxTokenId = Deno.env.get('MUX_TOKEN_ID')!;
    const muxTokenSecret = Deno.env.get('MUX_TOKEN_SECRET')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    
    // Get user from token
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { streamId } = await req.json();

    if (!streamId) {
      return new Response(
        JSON.stringify({ error: 'Stream ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Ending stream:', streamId, 'for user:', user.id);

    // Fetch stream details
    const { data: stream, error: fetchError } = await supabase
      .from('artist_live_streams')
      .select('id, artist_id, livepush_stream_id, provider, user_id, started_at')
      .eq('id', streamId)
      .single();

    if (fetchError || !stream) {
      console.error('Error fetching stream:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Stream not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the user owns this stream
    if (stream.user_id !== user.id) {
      console.error('User does not own stream');
      return new Response(
        JSON.stringify({ error: 'Not authorized to end this stream' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If it's a Mux stream, disable it via Mux API
    if (stream.provider === 'mux' && stream.livepush_stream_id) {
      console.log('Disabling Mux stream:', stream.livepush_stream_id);
      
      const muxAuth = btoa(`${muxTokenId}:${muxTokenSecret}`);
      
      const muxResponse = await fetch(
        `https://api.mux.com/video/v1/live-streams/${stream.livepush_stream_id}/disable`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Basic ${muxAuth}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!muxResponse.ok) {
        const errorText = await muxResponse.text();
        console.error('Mux API error:', errorText);
        // Continue anyway to update database
      } else {
        console.log('Mux stream disabled successfully');
      }
    }

    // Calculate duration
    let durationMinutes = 0;
    if (stream.started_at) {
      const startTime = new Date(stream.started_at);
      const endTime = new Date();
      durationMinutes = Math.floor((endTime.getTime() - startTime.getTime()) / (1000 * 60));
    }

    // Update stream status in database
    const { error: updateError } = await supabase
      .from('artist_live_streams')
      .update({
        status: 'ended',
        ended_at: new Date().toISOString(),
        duration_minutes: durationMinutes,
      })
      .eq('id', streamId);

    if (updateError) {
      console.error('Error updating stream:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update stream status' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Stream ended successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Stream ended successfully',
        duration_minutes: durationMinutes,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in end-mux-stream function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
