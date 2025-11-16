import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      console.error('Authentication error:', userError);
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { streamId } = await req.json();

    if (!streamId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Stream ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Cancelling stream:', streamId, 'for user:', user.id);

    // Get the stream to verify ownership and status
    const { data: stream, error: fetchError } = await supabaseClient
      .from('artist_live_streams')
      .select('id, artist_id, user_id, status, title')
      .eq('id', streamId)
      .single();

    if (fetchError || !stream) {
      console.error('Stream fetch error:', fetchError);
      return new Response(
        JSON.stringify({ success: false, error: 'Stream not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify ownership
    if (stream.user_id !== user.id) {
      console.error('User does not own this stream');
      return new Response(
        JSON.stringify({ success: false, error: 'You do not have permission to cancel this stream' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify stream can be cancelled (only scheduled/waiting streams)
    if (!['scheduled', 'waiting'].includes(stream.status)) {
      console.error('Stream cannot be cancelled, current status:', stream.status);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Cannot cancel a stream with status: ${stream.status}. Only scheduled or waiting streams can be cancelled.` 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update stream status to cancelled
    const { error: updateError } = await supabaseClient
      .from('artist_live_streams')
      .update({ 
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', streamId);

    if (updateError) {
      console.error('Error updating stream:', updateError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to cancel stream' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Stream cancelled successfully:', streamId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Stream cancelled successfully',
        streamId 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in cancel-stream function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
