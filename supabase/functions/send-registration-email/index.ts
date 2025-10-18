import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY");
const ADMIN_EMAIL = "colleen.nagle@subamerica.net";

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

const sendEmail = async (to: string, subject: string, html: string) => {
  const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${SENDGRID_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: "noreply@subamerica.net", name: "Subamerica" },
      subject,
      content: [{ type: "text/html", value: html }],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`SendGrid error: ${error}`);
  }

  return response;
};

const getAdminEmailHTML = (data: RegistrationData) => `
  <!DOCTYPE html>
  <html>
  <head>
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: #1a1a1a; color: white; padding: 20px; text-align: center; }
      .content { padding: 20px; background: #f9f9f9; }
      .info-row { margin: 10px 0; padding: 10px; background: white; border-left: 4px solid #9b87f5; }
      .label { font-weight: bold; color: #666; }
      .value { color: #333; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>🎵 New Artist Registration</h1>
      </div>
      <div class="content">
        <p>A new artist has joined Subamerica!</p>
        
        <div class="info-row">
          <span class="label">Artist Name:</span>
          <span class="value">${data.display_name}</span>
        </div>
        
        <div class="info-row">
          <span class="label">Email:</span>
          <span class="value">${data.email}</span>
        </div>
        
        <div class="info-row">
          <span class="label">Port URL:</span>
          <span class="value">subamerica.net/${data.slug}</span>
        </div>
        
        <div class="info-row">
          <span class="label">User ID:</span>
          <span class="value">${data.user_id}</span>
        </div>
        
        <div class="info-row">
          <span class="label">Registered:</span>
          <span class="value">${new Date(data.created_at).toLocaleString()}</span>
        </div>
      </div>
    </div>
  </body>
  </html>
`;

const getArtistWelcomeHTML = (data: RegistrationData) => `
  <!DOCTYPE html>
  <html>
  <head>
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
      .container { max-width: 600px; margin: 0 auto; }
      .header { background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); color: white; padding: 40px 20px; text-align: center; }
      .logo { font-size: 32px; font-weight: bold; margin-bottom: 10px; }
      .content { padding: 30px 20px; background: white; }
      .welcome { font-size: 24px; color: #9b87f5; margin-bottom: 20px; }
      .feature { margin: 15px 0; padding: 15px; background: #f9f9f9; border-radius: 8px; }
      .feature-icon { font-size: 20px; margin-right: 10px; }
      .cta-button { display: inline-block; background: #9b87f5; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; }
      .footer { padding: 20px; background: #f9f9f9; text-align: center; color: #666; font-size: 14px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <div class="logo">🎵 SUBAMERICA</div>
        <p style="margin: 0; opacity: 0.9;">Your Independent Artist Platform</p>
      </div>
      
      <div class="content">
        <h1 class="welcome">Welcome to Subamerica, ${data.display_name}! 🎉</h1>
        
        <p>We're thrilled to have you join our community of independent artists. Your artist port is now live at:</p>
        <p style="text-align: center; font-size: 18px; color: #9b87f5; font-weight: bold;">
          subamerica.net/${data.slug}
        </p>
        
        <p>Here's what you can do with your Subamerica account:</p>
        
        <div class="feature">
          <span class="feature-icon">📹</span>
          <strong>Upload & Showcase Videos</strong><br/>
          Share your music videos, live performances, and creative content
        </div>
        
        <div class="feature">
          <span class="feature-icon">🎨</span>
          <strong>Build Your Artist Port</strong><br/>
          Customize your page with your brand, bio, and social links
        </div>
        
        <div class="feature">
          <span class="feature-icon">👕</span>
          <strong>Sell Merchandise</strong><br/>
          Connect your merch and earn directly from your fans
        </div>
        
        <div class="feature">
          <span class="feature-icon">📡</span>
          <strong>Go Live</strong><br/>
          Stream live performances and events to your audience
        </div>
        
        <div style="text-align: center;">
          <a href="https://subamerica.net/dashboard" class="cta-button">
            Go to Your Dashboard →
          </a>
        </div>
        
        <p style="margin-top: 30px;">
          <strong>Next Steps:</strong>
        </p>
        <ul>
          <li>Complete your artist profile in the dashboard</li>
          <li>Upload your first video</li>
          <li>Customize your port settings</li>
          <li>Share your port link with fans</li>
        </ul>
        
        <p>
          Need help getting started? Check out our 
          <a href="https://subamerica.net/features" style="color: #9b87f5;">features page</a> 
          or reach out to us at support@subamerica.net
        </p>
      </div>
      
      <div class="footer">
        <p>Welcome to the underground. Let's build something amazing together.</p>
        <p style="margin-top: 10px; font-size: 12px;">
          © ${new Date().getFullYear()} Subamerica. All rights reserved.
        </p>
      </div>
    </div>
  </body>
  </html>
`;

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: RegistrationData = await req.json();
    
    console.log("Processing registration email for:", data.email);

    // Send admin notification email
    try {
      await sendEmail(
        ADMIN_EMAIL,
        `New Artist Registration - ${data.display_name}`,
        getAdminEmailHTML(data)
      );
      console.log("Admin notification sent successfully");
    } catch (error) {
      console.error("Failed to send admin notification:", error);
      // Continue even if admin email fails
    }

    // Send artist welcome email
    try {
      await sendEmail(
        data.email,
        `Welcome to Subamerica, ${data.display_name}! 🎵`,
        getArtistWelcomeHTML(data)
      );
      console.log("Artist welcome email sent successfully");
    } catch (error) {
      console.error("Failed to send artist welcome email:", error);
      // Log error but don't fail the request
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Registration emails sent" 
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-registration-email function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);
