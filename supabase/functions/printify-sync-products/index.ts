import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[PRINTIFY-SYNC] ${step}${detailsStr}`);
};

interface PrintifyProduct {
  id: string;
  title: string;
  description: string;
  blueprint_id: number;
  print_provider_id: number;
  variants: Array<{
    id: number;
    title: string;
    price: number;
  }>;
  images: Array<{
    src: string;
    variant_ids: number[];
    position: string;
  }>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Authenticate user
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Auth error: ${userError.message}`);
    
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    // Get artist_id for this user
    const { data: artistData, error: artistError } = await supabaseClient
      .from("artists")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (artistError || !artistData) {
      throw new Error("Artist profile not found");
    }
    const artistId = artistData.id;
    logStep("Artist found", { artistId });

    // Get Printify API token and shop ID from request body
    const { shop_id } = await req.json();
    if (!shop_id) throw new Error("Shop ID is required");

    const printifyToken = Deno.env.get("PRINTIFY_API_TOKEN");
    if (!printifyToken) throw new Error("Printify API token not configured");

    logStep("Fetching products from Printify", { shopId: shop_id });

    // Fetch products from Printify API
    const printifyResponse = await fetch(
      `https://api.printify.com/v1/shops/${shop_id}/products.json`,
      {
        headers: {
          "Authorization": `Bearer ${printifyToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!printifyResponse.ok) {
      const errorText = await printifyResponse.text();
      logStep("Printify API error", { status: printifyResponse.status, error: errorText });
      throw new Error(`Printify API error: ${printifyResponse.status} - ${errorText}`);
    }

    const printifyProducts = await printifyResponse.json() as { data: PrintifyProduct[] };
    logStep("Products fetched from Printify", { count: printifyProducts.data?.length || 0 });

    if (!printifyProducts.data || printifyProducts.data.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "No products found in Printify shop",
          imported: 0 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Import products
    const importedProducts = [];
    
    for (const printifyProduct of printifyProducts.data) {
      logStep("Processing Printify product", { 
        id: printifyProduct.id, 
        title: printifyProduct.title 
      });

      // Prepare variant data
      const variants = printifyProduct.variants?.map(v => ({
        name: v.title,
        price: v.price / 100, // Convert cents to dollars
      })) || [];

      // Prepare images array (take up to 3 images)
      const images = printifyProduct.images?.slice(0, 3).map(img => img.src) || [];

      // Calculate base price (lowest variant price)
      const basePrice = variants.length > 0 
        ? Math.min(...variants.map(v => v.price))
        : 0;

      // Insert product into database
      const { data: productData, error: productError } = await supabaseClient
        .from("products")
        .insert({
          artist_id: artistId,
          title: printifyProduct.title,
          description: printifyProduct.description || "",
          long_description: printifyProduct.description || "",
          type: "Apparel", // Most Printify products are apparel
          price: basePrice,
          currency: "usd",
          fulfillment: "printify",
          payment_type: "stripe",
          images: images,
          variants: variants,
          is_surface: false,
        })
        .select()
        .single();

      if (productError) {
        logStep("Error inserting product", { error: productError });
        continue;
      }

      logStep("Product inserted", { productId: productData.id });

      // Insert Printify mapping
      const { error: mappingError } = await supabaseClient
        .from("printify_products")
        .insert({
          product_id: productData.id,
          printify_product_id: printifyProduct.id,
          printify_blueprint_id: printifyProduct.blueprint_id?.toString(),
          print_provider_id: printifyProduct.print_provider_id,
          shop_id: parseInt(shop_id),
        });

      if (mappingError) {
        logStep("Error creating Printify mapping", { error: mappingError });
        // Don't fail the whole import, just log it
      }

      importedProducts.push({
        id: productData.id,
        title: productData.title,
      });
    }

    logStep("Import completed", { imported: importedProducts.length });

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully imported ${importedProducts.length} products from Printify`,
        imported: importedProducts.length,
        products: importedProducts,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        success: false 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
