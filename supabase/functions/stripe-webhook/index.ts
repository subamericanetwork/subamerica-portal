import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Webhook received");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      throw new Error("No Stripe signature found");
    }

    const body = await req.text();
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!webhookSecret) {
      throw new Error("STRIPE_WEBHOOK_SECRET not configured");
    }

    logStep("Verifying webhook signature");
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    logStep("Webhook verified", { type: event.type });

    // Only handle checkout.session.completed events
    if (event.type !== "checkout.session.completed") {
      logStep("Ignoring event type", { type: event.type });
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const session = event.data.object as Stripe.Checkout.Session;
    logStep("Processing checkout session", { sessionId: session.id });

    // Extract metadata
    const metadata = session.metadata;
    if (!metadata || !metadata.artist_id) {
      logStep("No tip metadata found, skipping");
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const artistId = metadata.artist_id;
    const artistName = metadata.artist_name || "Unknown Artist";
    const artistSlug = metadata.artist_slug || "";
    const tipAmount = metadata.tip_amount || "0";
    const tipperEmail = session.customer_details?.email || "unknown@email.com";

    logStep("Extracted tip data", { artistId, artistName, tipAmount, tipperEmail });

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Store tip in database
    logStep("Storing tip in database");
    const { error: insertError } = await supabaseClient
      .from("tips")
      .insert({
        stripe_session_id: session.id,
        artist_id: artistId,
        artist_name: artistName,
        artist_slug: artistSlug,
        amount: parseFloat(tipAmount) * 100, // Convert dollars to cents
        tipper_email: tipperEmail,
      });

    if (insertError) {
      logStep("Database insert error", { error: insertError });
      throw insertError;
    }

    logStep("Tip stored successfully");

    // Get admin email from admin_notification_preferences
    const { data: adminPrefs } = await supabaseClient
      .from("admin_notification_preferences")
      .select("email_address, email_enabled")
      .limit(1)
      .single();

    const adminEmail = adminPrefs?.email_address || "colleen.nagle@subamerica.net";
    const shouldSendAdminEmail = adminPrefs?.email_enabled !== false;

    logStep("Admin preferences", { adminEmail, shouldSendAdminEmail });

    const sendgridApiKey = Deno.env.get("SENDGRID_API_KEY");
    if (!sendgridApiKey) {
      throw new Error("SENDGRID_API_KEY not configured");
    }

    const fromEmail = "subamericanetwork@gmail.com";
    let adminEmailSent = false;
    let tipperEmailSent = false;

    // Send admin notification email
    if (shouldSendAdminEmail) {
      logStep("Sending admin notification email");
      
      const adminEmailData = {
        personalizations: [{
          to: [{ email: adminEmail }],
          subject: `New Tip Received for ${artistName}`,
        }],
        from: { email: fromEmail },
        content: [{
          type: "text/html",
          value: `
            <h2>New Tip Received!</h2>
            <p><strong>Tip Amount:</strong> $${tipAmount}</p>
            <p><strong>Artist:</strong> ${artistName}</p>
            <p><strong>Tipper Email:</strong> ${tipperEmail}</p>
            <p><strong>Transaction ID:</strong> ${session.id}</p>
            <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
          `,
        }],
      };

      const adminEmailResponse = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${sendgridApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(adminEmailData),
      });

      if (adminEmailResponse.ok) {
        logStep("Admin email sent successfully");
        adminEmailSent = true;
      } else {
        const error = await adminEmailResponse.text();
        logStep("Admin email failed", { status: adminEmailResponse.status, error });
      }
    }

    // Send tipper confirmation email
    logStep("Sending tipper confirmation email");
    
    const tipperEmailData = {
      personalizations: [{
        to: [{ email: tipperEmail }],
        subject: `Thank you for supporting ${artistName}!`,
      }],
      from: { email: fromEmail },
      content: [{
        type: "text/html",
        value: `
          <h2>Thank You for Your Support!</h2>
          <p>Your tip of <strong>$${tipAmount}</strong> to <strong>${artistName}</strong> has been received.</p>
          <p>Your support means the world to independent artists and helps them continue creating amazing content.</p>
          <p><strong>Transaction ID:</strong> ${session.id}</p>
          <p>Thank you for being awesome!</p>
          <p>- The SubAmerica Team</p>
        `,
      }],
    };

    const tipperEmailResponse = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${sendgridApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(tipperEmailData),
    });

    if (tipperEmailResponse.ok) {
      logStep("Tipper email sent successfully");
      tipperEmailSent = true;
    } else {
      const error = await tipperEmailResponse.text();
      logStep("Tipper email failed", { status: tipperEmailResponse.status, error });
    }

    // Update email sent status in database
    await supabaseClient
      .from("tips")
      .update({
        admin_email_sent: adminEmailSent,
        tipper_email_sent: tipperEmailSent,
      })
      .eq("stripe_session_id", session.id);

    logStep("Webhook processing complete", { 
      adminEmailSent, 
      tipperEmailSent 
    });

    return new Response(
      JSON.stringify({ 
        received: true, 
        adminEmailSent, 
        tipperEmailSent 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
