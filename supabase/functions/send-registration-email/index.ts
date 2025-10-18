import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY");
const ADMIN_EMAIL = "colleen.nagle@subamerica.net";
const FROM_EMAIL = "noreply@subamerica.net";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RegistrationData {
  user_id: string;
  email: string;
  display_name: string;
  slug: string;
  created_at: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const registrationData: RegistrationData = await req.json();
    console.log("Processing registration email for:", registrationData.display_name);

    if (!SENDGRID_API_KEY) {
      throw new Error("SENDGRID_API_KEY is not configured");
    }

    // Prepare admin notification email
    const adminEmail = {
      personalizations: [
        {
          to: [{ email: ADMIN_EMAIL }],
          subject: `New Artist Registration - ${registrationData.display_name}`,
        },
      ],
      from: { email: FROM_EMAIL, name: "Subamerica Platform" },
      content: [
        {
          type: "text/html",
          value: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">New Artist Registration</h2>
              <p>A new artist has joined Subamerica!</p>
              
              <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
                <p><strong>Display Name:</strong> ${registrationData.display_name}</p>
                <p><strong>Email:</strong> ${registrationData.email}</p>
                <p><strong>Port URL:</strong> subamerica.net/${registrationData.slug}</p>
                <p><strong>User ID:</strong> ${registrationData.user_id}</p>
                <p><strong>Registered:</strong> ${new Date(registrationData.created_at).toLocaleString()}</p>
              </div>
              
              <p style="color: #666; font-size: 14px;">
                This is an automated notification from the Subamerica platform.
              </p>
            </div>
          `,
        },
      ],
    };

    // Prepare artist welcome email
    const artistEmail = {
      personalizations: [
        {
          to: [{ email: registrationData.email }],
          subject: `Welcome to Subamerica, ${registrationData.display_name}! 🎵`,
        },
      ],
      from: { email: FROM_EMAIL, name: "Subamerica" },
      content: [
        {
          type: "text/html",
          value: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0;">Welcome to Subamerica! 🎵</h1>
              </div>
              
              <div style="padding: 30px 20px; background-color: #ffffff;">
                <p style="font-size: 16px; color: #333;">Hey ${registrationData.display_name},</p>
                
                <p style="font-size: 16px; color: #333; line-height: 1.6;">
                  We're thrilled to have you join the Subamerica community! You've just unlocked the ultimate platform 
                  for independent artists to upload, stream, and earn.
                </p>
                
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 25px 0;">
                  <h3 style="color: #333; margin-top: 0;">🚀 Get Started:</h3>
                  <ul style="color: #555; line-height: 1.8;">
                    <li><strong>Build Your Port:</strong> Create your artist profile and customize your page</li>
                    <li><strong>Upload Videos:</strong> Share your music videos and performances</li>
                    <li><strong>Sell Merch:</strong> Set up your merchandise store</li>
                    <li><strong>Go Live:</strong> Stream your performances to fans worldwide</li>
                  </ul>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="https://subamerica.net/dashboard" 
                     style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                            color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; 
                            font-weight: bold; font-size: 16px;">
                    Go to Your Dashboard
                  </a>
                </div>
                
                <p style="font-size: 14px; color: #666; margin-top: 30px;">
                  Your artist port is live at: 
                  <a href="https://subamerica.net/${registrationData.slug}" style="color: #667eea;">
                    subamerica.net/${registrationData.slug}
                  </a>
                </p>
                
                <div style="border-top: 2px solid #eee; margin-top: 30px; padding-top: 20px;">
                  <p style="font-size: 14px; color: #666;">
                    Need help getting started? Check out our 
                    <a href="https://subamerica.net/features" style="color: #667eea;">features page</a> 
                    or reach out to our support team.
                  </p>
                  
                  <p style="font-size: 14px; color: #666; margin-top: 15px;">
                    Let's make some noise! 🎸
                  </p>
                  
                  <p style="font-size: 14px; color: #666; margin-top: 15px;">
                    <strong>The Subamerica Team</strong>
                  </p>
                </div>
              </div>
              
              <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 10px 10px;">
                <p style="font-size: 12px; color: #999; margin: 0;">
                  © ${new Date().getFullYear()} Subamerica. All rights reserved.
                </p>
              </div>
            </div>
          `,
        },
      ],
    };

    // Send admin notification
    console.log("Sending admin notification email...");
    const adminResponse = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${SENDGRID_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(adminEmail),
    });

    if (!adminResponse.ok) {
      const errorText = await adminResponse.text();
      console.error("Failed to send admin email:", errorText);
    } else {
      console.log("Admin notification email sent successfully");
    }

    // Send artist welcome email
    console.log("Sending artist welcome email...");
    const artistResponse = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${SENDGRID_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(artistEmail),
    });

    if (!artistResponse.ok) {
      const errorText = await artistResponse.text();
      console.error("Failed to send artist email:", errorText);
    } else {
      console.log("Artist welcome email sent successfully");
    }

    return new Response(
      JSON.stringify({
        success: true,
        admin_email_sent: adminResponse.ok,
        artist_email_sent: artistResponse.ok,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in send-registration-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
