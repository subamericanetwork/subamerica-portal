import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY");
const ADMIN_EMAIL = "colleen.nagle@subamerica.net";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ApplicationData {
  user_id: string;
  email: string;
  display_name: string;
  artist_name: string;
  slug: string;
  bio?: string;
  why_join: string;
  scene?: string;
  portfolio_links?: any[];
  created_at: string;
}

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
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
    throw new Error(`SendGrid API error: ${error}`);
  }
}

function getAdminEmailHTML(data: ApplicationData): string {
  const portfolioLinks = Array.isArray(data.portfolio_links) 
    ? data.portfolio_links.map(link => `<li><a href="${link}" style="color: #2754C5;">${link}</a></li>`).join('')
    : '<li>No portfolio links provided</li>';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .field { margin-bottom: 20px; padding: 15px; background: white; border-radius: 6px; border-left: 4px solid #2754C5; }
        .field-label { font-weight: bold; color: #555; font-size: 12px; text-transform: uppercase; margin-bottom: 5px; }
        .field-value { color: #333; font-size: 14px; }
        .why-join { background: #fff8e1; border-left-color: #ffa726; }
        ul { margin: 5px 0; padding-left: 20px; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">🎵 New Artist Application</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Subamerica Artist Portal</p>
        </div>
        <div class="content">
          <div class="field">
            <div class="field-label">Artist Name</div>
            <div class="field-value"><strong>${data.artist_name}</strong></div>
          </div>

          <div class="field">
            <div class="field-label">Port URL (Slug)</div>
            <div class="field-value"><code>subamerica.net/${data.slug}</code></div>
          </div>

          <div class="field">
            <div class="field-label">Applicant Email</div>
            <div class="field-value">${data.email}</div>
          </div>

          ${data.scene ? `
          <div class="field">
            <div class="field-label">Music Scene / Genre</div>
            <div class="field-value">${data.scene}</div>
          </div>
          ` : ''}

          ${data.bio ? `
          <div class="field">
            <div class="field-label">Bio</div>
            <div class="field-value">${data.bio}</div>
          </div>
          ` : ''}

          <div class="field why-join">
            <div class="field-label">Why They Want to Join</div>
            <div class="field-value">${data.why_join}</div>
          </div>

          <div class="field">
            <div class="field-label">Portfolio Links</div>
            <div class="field-value">
              <ul>${portfolioLinks}</ul>
            </div>
          </div>

          <div class="field">
            <div class="field-label">Application Details</div>
            <div class="field-value">
              <strong>User ID:</strong> ${data.user_id}<br>
              <strong>Display Name:</strong> ${data.display_name}<br>
              <strong>Submitted:</strong> ${new Date(data.created_at).toLocaleString()}
            </div>
          </div>
        </div>
        <div class="footer">
          <p>Review this application in your admin dashboard</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function getApplicantEmailHTML(data: ApplicationData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); color: white; padding: 40px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .highlight { background: #f0f7ff; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #2754C5; }
        .info-box { background: #f9f9f9; padding: 20px; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; padding: 20px; }
        .btn { display: inline-block; padding: 12px 24px; background: #2754C5; color: white; text-decoration: none; border-radius: 6px; margin: 10px 0; }
        ul { margin: 10px 0; padding-left: 20px; }
        li { margin: 5px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">✨ Application Received!</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Welcome to Subamerica</p>
        </div>
        <div class="content">
          <p>Hi <strong>${data.display_name}</strong>,</p>
          
          <p>Thank you for applying to become a Subamerican artist! We're excited to review your application.</p>

          <div class="highlight">
            <h3 style="margin-top: 0;">📋 What You Submitted:</h3>
            <p><strong>Artist Name:</strong> ${data.artist_name}</p>
            <p><strong>Your Port URL:</strong> subamerica.net/${data.slug}</p>
          </div>

          <div class="info-box">
            <h3 style="margin-top: 0;">⏱️ What Happens Next?</h3>
            <ul>
              <li><strong>Review Period:</strong> We review all applications within 48 hours</li>
              <li><strong>Notification:</strong> You'll receive an email once your application is reviewed</li>
              <li><strong>Check Status:</strong> You can view your application status anytime in your dashboard</li>
            </ul>
          </div>

          <p>We carefully review each application to ensure the best fit for the Subamerica community. Our team will evaluate your music, portfolio, and alignment with our platform.</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="https://subamerica.net/application-status" class="btn">Check Application Status</a>
          </div>

          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            <strong>Questions?</strong> Feel free to reach out to our team at 
            <a href="mailto:support@subamerica.net" style="color: #2754C5;">support@subamerica.net</a>
          </p>
        </div>
        <div class="footer">
          <p><strong>Subamerica</strong> - Your Complete Artist Toolkit</p>
          <p style="margin: 5px 0;">© ${new Date().getFullYear()} Subamerica. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Received artist application email request");

    if (!SENDGRID_API_KEY) {
      throw new Error("SENDGRID_API_KEY is not configured");
    }

    const data: ApplicationData = await req.json();
    console.log("Application data:", {
      artist_name: data.artist_name,
      email: data.email,
      slug: data.slug,
    });

    // Send admin notification email
    console.log("Sending admin notification email...");
    await sendEmail(
      ADMIN_EMAIL,
      `New Artist Application - ${data.artist_name}`,
      getAdminEmailHTML(data)
    );
    console.log("Admin email sent successfully");

    // Send applicant confirmation email
    console.log("Sending applicant confirmation email...");
    await sendEmail(
      data.email,
      "We Received Your Subamerica Artist Application",
      getApplicantEmailHTML(data)
    );
    console.log("Applicant email sent successfully");

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Application emails sent successfully" 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-application-email function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: "Failed to send application emails"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
