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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all active streams (scheduled, waiting, or ready)
    const { data: streams, error: fetchError } = await supabase
      .from('artist_live_streams')
      .select('*')
      .in('status', ['scheduled', 'waiting', 'ready'])
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching streams:', fetchError);
      throw fetchError;
    }

    if (!streams || streams.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No active streams to poll', checked: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    console.log(`Polling ${streams.length} streams for status updates`);

    const updates = [];

    for (const stream of streams) {
      try {
        // Check Mux streams
        if (stream.provider === 'mux' && stream.livepush_stream_id) {
          const muxTokenId = Deno.env.get('MUX_TOKEN_ID');
          const muxTokenSecret = Deno.env.get('MUX_TOKEN_SECRET');

          if (!muxTokenId || !muxTokenSecret) {
            console.log('Mux credentials not configured, skipping Mux stream');
            continue;
          }

          const authString = btoa(`${muxTokenId}:${muxTokenSecret}`);
          const muxResponse = await fetch(
            `https://api.mux.com/video/v1/live-streams/${stream.livepush_stream_id}`,
            {
              headers: {
                'Authorization': `Basic ${authString}`,
                'Content-Type': 'application/json',
              },
            }
          );

          if (muxResponse.ok) {
            const muxData = await muxResponse.json();
            const muxStatus = muxData.data.status;

            console.log(`Mux stream ${stream.id}: Mux status = ${muxStatus}, DB status = ${stream.status}`);

            // Map Mux status to our status
            let newStatus = stream.status;
            const updateData: any = {};

            if (muxStatus === 'active' && stream.status !== 'live') {
              newStatus = 'live';
              updateData.started_at = new Date().toISOString();
              console.log(`🔴 Stream ${stream.id} is now LIVE!`);
            } else if (muxStatus === 'idle' && stream.status === 'live') {
              newStatus = 'ended';
              updateData.ended_at = new Date().toISOString();
              if (stream.started_at) {
                const duration = Math.floor(
                  (new Date().getTime() - new Date(stream.started_at).getTime()) / 60000
                );
                updateData.duration_minutes = duration;
              }
              console.log(`⚫ Stream ${stream.id} has ended`);
            }

            if (newStatus !== stream.status) {
              updateData.status = newStatus;
              
              const { error: updateError } = await supabase
                .from('artist_live_streams')
                .update(updateData)
                .eq('id', stream.id);

              if (updateError) {
                console.error(`Error updating stream ${stream.id}:`, updateError);
              } else {
                updates.push({
                  streamId: stream.id,
                  oldStatus: stream.status,
                  newStatus,
                  provider: 'mux',
                });
              }
            }
          }
        }

        // Check Livepush streams
        if (stream.provider === 'livepush' && stream.livepush_stream_id) {
          // Livepush status checking would go here
          // For now, we'll rely on webhooks for Livepush
          console.log(`Livepush stream ${stream.id}: status checking not implemented yet`);
        }
      } catch (streamError) {
        console.error(`Error checking stream ${stream.id}:`, streamError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        checked: streams.length,
        updated: updates.length,
        updates,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Poll stream status error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
