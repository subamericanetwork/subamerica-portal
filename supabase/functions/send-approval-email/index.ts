import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY');
const SENDGRID_API_URL = 'https://api.sendgrid.com/v3/mail/send';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ApprovalEmailRequest {
  artist_email: string;
  artist_name: string;
  slug: string;
  admin_notes?: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { artist_email, artist_name, slug, admin_notes }: ApprovalEmailRequest = await req.json();

    console.log('Sending approval email to:', artist_email);

    if (!SENDGRID_API_KEY) {
      throw new Error('SENDGRID_API_KEY is not configured');
    }

    // Admin email addresses to CC
    const adminEmails = ['colleen.nagle@subamerica.net', 'subamerica@gmail.com'];

    const emailData = {
      personalizations: [
        {
          to: [{ email: artist_email, name: artist_name }],
          cc: adminEmails.map(email => ({ email })),
          subject: '🎉 Congratulations! Your Artist Application Has Been Approved'
        }
      ],
      from: {
        email: 'noreply@subamerica.net',
        name: 'Subamerica'
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
                <h1 style="margin: 0;">🎉 Welcome to Subamerica!</h1>
              </div>
              
              <div class="content">
                <h2>Congratulations, ${artist_name}!</h2>
                
                <p>We're thrilled to inform you that your artist application has been <strong>approved</strong>! You are now an official Subamerica artist.</p>
                
                <div class="info-box">
                  <h3 style="margin-top: 0;">Your Artist Port</h3>
                  <p><strong>Port URL:</strong> @${slug}</p>
                  <p>Your port is ready to be customized and published!</p>
                </div>

                ${admin_notes ? `
                <div class="info-box">
                  <h3 style="margin-top: 0;">Message from Admin</h3>
                  <p>${admin_notes}</p>
                </div>
                ` : ''}
                
                <h3>Next Steps:</h3>
                <ol>
                  <li><strong>Set up your artist profile</strong> - Add your bio, social links, and branding</li>
                  <li><strong>Upload your content</strong> - Share your videos, events, and posts</li>
                  <li><strong>Customize your port</strong> - Make it uniquely yours</li>
                  <li><strong>Publish your port</strong> - Go live when you're ready!</li>
                </ol>
                
                <center>
                  <a href="https://subamerica.net/dashboard" class="button">Go to Dashboard</a>
                </center>
                
                <p>If you have any questions or need assistance getting started, don't hesitate to reach out to our team.</p>
                
                <p><strong>Welcome to the Subamerica family!</strong></p>
              </div>
              
              <div class="footer">
                <p>Subamerica - Artist Portal</p>
                <p>This email was sent because your artist application was approved.</p>
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

    console.log('Approval email sent successfully to:', artist_email);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Approval email sent successfully',
        recipient: artist_email,
        cc: adminEmails
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Error in send-approval-email function:', error);
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
