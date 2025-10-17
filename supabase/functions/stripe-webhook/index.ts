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

    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      throw new Error("No Stripe signature found");
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    const sendgridKey = Deno.env.get("SENDGRID_API_KEY");

    if (!stripeKey || !webhookSecret || !sendgridKey) {
      throw new Error("Missing required environment variables");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const body = await req.text();

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      logStep("Webhook signature verified", { eventType: event.type });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logStep("Webhook signature verification failed", { error: errorMessage });
      return new Response(JSON.stringify({ error: `Webhook Error: ${errorMessage}` }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Only process checkout.session.completed events
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
    if (!metadata || !metadata.artist_id || !metadata.artist_name || !metadata.tip_amount) {
      logStep("Missing metadata in session", { metadata });
      throw new Error("Missing required metadata in checkout session");
    }

    const artistId = metadata.artist_id;
    const artistName = metadata.artist_name;
    const artistSlug = metadata.artist_slug || "";
    const tipAmount = parseFloat(metadata.tip_amount); // Amount in dollars
    const tipperEmail = session.customer_details?.email || "Unknown";

    logStep("Tip details extracted", { artistId, artistName, tipAmount, tipperEmail });

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Store tip record in database
    const { error: insertError } = await supabase
      .from("tips")
      .insert({
        stripe_session_id: session.id,
        artist_id: artistId,
        artist_name: artistName,
        artist_slug: artistSlug,
        amount: Math.round(tipAmount * 100), // Store as cents
        tipper_email: tipperEmail,
        admin_email_sent: false,
        tipper_email_sent: false,
      });

    if (insertError) {
      logStep("Error inserting tip record", { error: insertError });
      throw insertError;
    }

    logStep("Tip record stored in database");

    // Get admin email from admin_notification_preferences
    const { data: adminPrefs } = await supabase
      .from("admin_notification_preferences")
      .select("email_address, email_enabled")
      .limit(1)
      .single();

    const adminEmail = adminPrefs?.email_address || "colleen.nagle@subamerica.net";
    const emailEnabled = adminPrefs?.email_enabled !== false;

    logStep("Admin email preferences", { adminEmail, emailEnabled });

    let adminEmailSent = false;
    let tipperEmailSent = false;

    if (emailEnabled) {
      // Send admin notification email
      const adminEmailData = {
        personalizations: [{
          to: [{ email: adminEmail }],
          subject: `New Tip Received for ${artistName}`,
        }],
        from: { email: "subamericanetwork@gmail.com", name: "SubAmerica Network" },
        content: [{
          type: "text/html",
          value: `
            <h2>New Tip Received!</h2>
            <p><strong>Artist:</strong> ${artistName}</p>
            <p><strong>Tip Amount:</strong> $${tipAmount.toFixed(2)}</p>
            <p><strong>Tipper Email:</strong> ${tipperEmail}</p>
            <p><strong>Transaction ID:</strong> ${session.id}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
          `
        }]
      };

      try {
        const adminResponse = await fetch("https://api.sendgrid.com/v3/mail/send", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${sendgridKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(adminEmailData),
        });

        if (adminResponse.ok) {
          adminEmailSent = true;
          logStep("Admin email sent successfully");
        } else {
          const errorText = await adminResponse.text();
          logStep("Failed to send admin email", { status: adminResponse.status, error: errorText });
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        logStep("Error sending admin email", { error: errorMessage });
      }

      // Send tipper confirmation email
      const tipperEmailData = {
        personalizations: [{
          to: [{ email: tipperEmail }],
          subject: `Thank you for supporting ${artistName}!`,
        }],
        from: { email: "subamericanetwork@gmail.com", name: "SubAmerica Network" },
        content: [{
          type: "text/html",
          value: `
            <h2>Thank You for Your Support!</h2>
            <p>Dear ${session.customer_details?.name || "Fan"},</p>
            <p>Thank you for your generous tip of <strong>$${tipAmount.toFixed(2)}</strong> to support <strong>${artistName}</strong>.</p>
            <p>Your support means the world to independent artists and helps them continue creating amazing content.</p>
            <p><strong>Transaction ID:</strong> ${session.id}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
            <br>
            <p>With gratitude,<br>The SubAmerica Network Team</p>
          `
        }]
      };

      try {
        const tipperResponse = await fetch("https://api.sendgrid.com/v3/mail/send", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${sendgridKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(tipperEmailData),
        });

        if (tipperResponse.ok) {
          tipperEmailSent = true;
          logStep("Tipper confirmation email sent successfully");
        } else {
          const errorText = await tipperResponse.text();
          logStep("Failed to send tipper email", { status: tipperResponse.status, error: errorText });
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        logStep("Error sending tipper email", { error: errorMessage });
      }
    }

    // Update email sent status in database
    await supabase
      .from("tips")
      .update({
        admin_email_sent: adminEmailSent,
        tipper_email_sent: tipperEmailSent,
      })
      .eq("stripe_session_id", session.id);

    logStep("Webhook processing complete", { adminEmailSent, tipperEmailSent });

    return new Response(JSON.stringify({ 
      received: true, 
      adminEmailSent, 
      tipperEmailSent 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in webhook processing", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
