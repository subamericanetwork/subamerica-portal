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
    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error("User not authenticated");
    }

    const { productName, productDescription, priceAmount, priceCurrency } = await req.json();

    if (!productName || !priceAmount || !priceCurrency) {
      throw new Error("Missing required fields: productName, priceAmount, or priceCurrency");
    }

    // Validate amount is a positive number
    const amount = parseInt(priceAmount);
    if (isNaN(amount) || amount <= 0) {
      throw new Error("Price amount must be a positive number");
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Create product
    const product = await stripe.products.create({
      name: productName,
      description: productDescription || undefined,
    });

    console.log(`Created Stripe product: ${product.id} - ${productName}`);

    // Create price
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: amount,
      currency: priceCurrency.toLowerCase(),
    });

    console.log(`Created Stripe price: ${price.id} - ${amount} ${priceCurrency}`);

    return new Response(
      JSON.stringify({ 
        product_id: product.id, 
        price_id: price.id,
        amount: amount,
        currency: priceCurrency 
      }), 
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error creating Stripe product/price:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
