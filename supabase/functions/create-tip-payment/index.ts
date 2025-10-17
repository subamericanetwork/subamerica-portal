import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    const { artistId, artistName, artistSlug, amount } = await req.json();

    if (!artistId || !artistName || !amount) {
      throw new Error("Missing required fields: artistId, artistName, or amount");
    }

    // Validate amount is a positive number
    const tipAmount = parseInt(amount);
    if (isNaN(tipAmount) || tipAmount < 100) {
      throw new Error("Tip amount must be at least $1.00");
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Get user email if authenticated
    let userEmail;
    try {
      const authHeader = req.headers.get("Authorization");
      if (authHeader) {
        const token = authHeader.replace("Bearer ", "");
        const { data } = await supabaseClient.auth.getUser(token);
        userEmail = data.user?.email;
      }
    } catch (e) {
      console.log("No authenticated user, continuing with guest checkout");
    }

    // Check if customer exists
    let customerId;
    if (userEmail) {
      const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
      }
    }

    // Create checkout session with custom amount
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : userEmail,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Tip for ${artistName}`,
              description: `Support ${artistName} with a tip`,
            },
            unit_amount: tipAmount,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      metadata: {
        artist_id: artistId,
        artist_name: artistName,
        artist_slug: artistSlug,
        tip_amount: tipAmount.toString(),
      },
      success_url: `${req.headers.get("origin")}/${artistSlug}?tip=success`,
      cancel_url: `${req.headers.get("origin")}/${artistSlug}?tip=cancelled`,
    });

    console.log(`Tip session created for artist ${artistName} (${artistId}), amount: $${tipAmount / 100}`);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error creating tip payment:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
