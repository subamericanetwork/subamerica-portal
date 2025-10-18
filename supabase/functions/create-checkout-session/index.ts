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
    const { priceId, type, itemId } = await req.json();

    if (!priceId || !type) {
      throw new Error("Missing required fields: priceId or type");
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Get user email if authenticated (optional for guest checkout)
    let userEmail;
    let customerId;
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
    if (userEmail) {
      const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
      }
    }

    // Prepare metadata
    let metadata: Record<string, string> = {
      type: type,
      item_id: itemId,
    };

    // If it's a product purchase, fetch product details for email notifications
    if (type === 'product' && itemId) {
      const { data: product } = await supabaseClient
        .from('products')
        .select('id, title, artist_id, variants')
        .eq('id', itemId)
        .single();

      if (product) {
        metadata.product_id = product.id;
        metadata.product_name = product.title;
        metadata.artist_id = product.artist_id;
        metadata.quantity = '1';
        
        // Check if it's a Printify product
        const { data: printifyProduct } = await supabaseClient
          .from('printify_products')
          .select('printify_product_id')
          .eq('product_id', product.id)
          .single();

        if (printifyProduct) {
          metadata.printify_product_id = printifyProduct.printify_product_id;
        }

        // Add variant info if available
        if (product.variants && Array.isArray(product.variants) && product.variants.length > 0) {
          const firstVariant = product.variants[0];
          if (firstVariant.size || firstVariant.color) {
            metadata.product_variant = `${firstVariant.size || ''} ${firstVariant.color || ''}`.trim();
          }
        }
      }
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : userEmail,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "payment",
      metadata: metadata,
      success_url: `${req.headers.get("origin")}?purchase=success`,
      cancel_url: `${req.headers.get("origin")}?purchase=cancelled`,
    });

    console.log(`Checkout session created for ${type}: ${itemId}`);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error creating checkout session:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
