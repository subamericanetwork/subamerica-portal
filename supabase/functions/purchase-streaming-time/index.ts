import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
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
    const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY not configured');
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: '2024-11-20.acacia',
      httpClient: Stripe.createFetchHttpClient(),
    });

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { artist_id } = await req.json();

    // Get artist data
    const { data: artist } = await supabase
      .from('artists')
      .select('user_id, email, display_name, stripe_customer_id')
      .eq('id', artist_id)
      .single();

    if (!artist || artist.user_id !== user.id) {
      throw new Error('Unauthorized');
    }

    // Find or create Stripe customer
    let customerId = artist.stripe_customer_id;
    
    if (!customerId) {
      const customers = await stripe.customers.list({ 
        email: artist.email, 
        limit: 1 
      });
      
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
      } else {
        const customer = await stripe.customers.create({
          email: artist.email,
          name: artist.display_name,
          metadata: {
            artist_id: artist_id,
            user_id: user.id
          }
        });
        customerId = customer.id;
      }

      // Update artist with Stripe customer ID
      await supabase
        .from('artists')
        .update({ stripe_customer_id: customerId })
        .eq('id', artist_id);
    }

    // Create checkout session for $15 = 60 minutes
    const origin = req.headers.get('origin') || 'https://subamerica.net';
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Livestream Time (1 Hour)',
            description: 'Add 60 minutes to your streaming allowance'
          },
          unit_amount: 1500, // $15 in cents
        },
        quantity: 1
      }],
      mode: 'payment',
      metadata: {
        type: 'streaming_time',
        artist_id: artist_id,
        minutes_purchased: '60'
      },
      success_url: `${origin}/dashboard?streaming_purchased=success`,
      cancel_url: `${origin}/dashboard?streaming_purchased=cancelled`
    });

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[Purchase Streaming Time] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});