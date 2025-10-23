import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY');
const SENDGRID_API_URL = 'https://api.sendgrid.com/v3/mail/send';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RogerNotificationRequest {
  artist_name: string;
  artist_email: string;
  artist_slug: string;
  admin_notes: string;
  verification_evidence?: any;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      artist_name, 
      artist_email, 
      artist_slug, 
      admin_notes,
      verification_evidence 
    }: RogerNotificationRequest = await req.json();

    console.log('Sending Roger notification for:', artist_name);

    if (!SENDGRID_API_KEY) {
      throw new Error('SENDGRID_API_KEY is not configured');
    }

    // Admin email addresses to CC
    const adminEmails = [
      'colleen.nagle@subamerica.net', 
      'subamerica@gmail.com'
    ];

    const evidenceLinks = verification_evidence ? `
      <div style="background: white; padding: 15px; border-left: 4px solid #667eea; margin: 20px 0;">
        <h3 style="margin-top: 0;">Verification Evidence</h3>
        ${verification_evidence.spotify_url ? `<p><strong>Spotify:</strong> <a href="${verification_evidence.spotify_url}">${verification_evidence.spotify_url}</a></p>` : ''}
        ${verification_evidence.instagram_url ? `<p><strong>Instagram:</strong> <a href="${verification_evidence.instagram_url}">${verification_evidence.instagram_url}</a></p>` : ''}
        ${verification_evidence.youtube_url ? `<p><strong>YouTube:</strong> <a href="${verification_evidence.youtube_url}">${verification_evidence.youtube_url}</a></p>` : ''}
        ${verification_evidence.other_urls ? `<p><strong>Other Links:</strong> ${verification_evidence.other_urls}</p>` : ''}
        ${verification_evidence.additional_notes ? `<p><strong>Artist Notes:</strong> ${verification_evidence.additional_notes}</p>` : ''}
      </div>
    ` : '';

    const emailData = {
      personalizations: [
        {
          to: [{ email: 'roger@subamerica.net', name: 'Roger' }],
          cc: adminEmails.map(email => ({ email })),
          subject: `🔔 Verification Request Ready for Final Approval - ${artist_name}`
        }
      ],
      from: {
        email: 'noreply@subamerica.net',
        name: 'Subamerica Admin System'
      },
      content: [
        {
          type: 'text/html',
          value: `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body {
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                  line-height: 1.6;
                  color: #333;
                  max-width: 600px;
                  margin: 0 auto;
                  padding: 20px;
                }
                .header {
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  color: white;
                  padding: 30px;
                  border-radius: 10px 10px 0 0;
                  text-align: center;
                }
                .content {
                  background: #f9f9f9;
                  padding: 30px;
                  border-radius: 0 0 10px 10px;
                }
                .button {
                  display: inline-block;
                  padding: 12px 30px;
                  background: #667eea;
                  color: white;
                  text-decoration: none;
                  border-radius: 5px;
                  margin: 20px 0;
                }
                .info-box {
                  background: white;
                  padding: 15px;
                  border-left: 4px solid #667eea;
                  margin: 20px 0;
                }
                .footer {
                  text-align: center;
                  margin-top: 30px;
                  padding-top: 20px;
                  border-top: 1px solid #ddd;
                  color: #666;
                  font-size: 14px;
                }
              </style>
            </head>
            <body>
              <div class="header">
                <h1 style="margin: 0;">🔔 Verification Ready for Final Approval</h1>
              </div>
              
              <div class="content">
                <h2>Hi Roger,</h2>
                
                <p>A verification request has been reviewed by an admin and is ready for your final approval.</p>
                
                <div class="info-box">
                  <h3 style="margin-top: 0;">Artist Information</h3>
                  <p><strong>Artist Name:</strong> ${artist_name}</p>
                  <p><strong>Email:</strong> ${artist_email}</p>
                  <p><strong>Port Slug:</strong> @${artist_slug}</p>
                  <p><strong>Port URL:</strong> <a href="https://subamerica.net/${artist_slug}">https://subamerica.net/${artist_slug}</a></p>
                </div>

                <div class="info-box">
                  <h3 style="margin-top: 0;">Admin Review Notes</h3>
                  <p>${admin_notes}</p>
                </div>

                ${evidenceLinks}
                
                <center>
                  <a href="https://subamerica.net/admin/roger-approval" class="button">Review & Approve</a>
                </center>
                
                <p>Please review this request and make your final decision in the admin panel.</p>
              </div>
              
              <div class="footer">
                <p>Subamerica - Admin Notification System</p>
              </div>
            </body>
            </html>
          `
        }
      ]
    };

    console.log('Sending email via SendGrid...');

    const response = await fetch(SENDGRID_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('SendGrid API error:', errorText);
      throw new Error(`SendGrid API error: ${response.status} - ${errorText}`);
    }

    console.log('Roger notification sent successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Roger notification sent successfully',
        recipient: 'roger@subamerica.net',
        cc: adminEmails
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Error in send-roger-notification function:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
