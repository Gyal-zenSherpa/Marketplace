import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  userEmail: string;
  userName: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("send-welcome-email function called");
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userEmail, userName }: WelcomeEmailRequest = await req.json();

    console.log(`Sending welcome email to ${userEmail}`);

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to Marketplace Nepal!</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 40px 30px; text-align: center;">
                      <div style="font-size: 48px; margin-bottom: 16px;">🎉</div>
                      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">Welcome to Marketplace!</h1>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px 30px;">
                      <p style="color: #374151; font-size: 18px; line-height: 1.6; margin: 0 0 20px 0;">
                        Hi <strong>${userName}</strong>! 👋
                      </p>
                      
                      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                        Thank you for joining Marketplace Nepal! We're thrilled to have you as part of our community. Get ready to discover amazing products from local sellers across Nepal.
                      </p>

                      <!-- Features Grid -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                        <tr>
                          <td width="50%" style="padding: 10px;">
                            <div style="background-color: #f0fdf4; border-radius: 12px; padding: 20px; text-align: center; height: 100%;">
                              <div style="font-size: 32px; margin-bottom: 12px;">🛍️</div>
                              <h3 style="color: #166534; margin: 0 0 8px 0; font-size: 16px;">Shop Local</h3>
                              <p style="color: #15803d; margin: 0; font-size: 14px;">Discover unique products from Nepali sellers</p>
                            </div>
                          </td>
                          <td width="50%" style="padding: 10px;">
                            <div style="background-color: #eff6ff; border-radius: 12px; padding: 20px; text-align: center; height: 100%;">
                              <div style="font-size: 32px; margin-bottom: 12px;">⭐</div>
                              <h3 style="color: #1e40af; margin: 0 0 8px 0; font-size: 16px;">Earn Rewards</h3>
                              <p style="color: #1d4ed8; margin: 0; font-size: 14px;">Get points on every purchase</p>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td width="50%" style="padding: 10px;">
                            <div style="background-color: #fef3c7; border-radius: 12px; padding: 20px; text-align: center; height: 100%;">
                              <div style="font-size: 32px; margin-bottom: 12px;">🏪</div>
                              <h3 style="color: #92400e; margin: 0 0 8px 0; font-size: 16px;">Become a Seller</h3>
                              <p style="color: #a16207; margin: 0; font-size: 14px;">Start your own online business</p>
                            </div>
                          </td>
                          <td width="50%" style="padding: 10px;">
                            <div style="background-color: #fce7f3; border-radius: 12px; padding: 20px; text-align: center; height: 100%;">
                              <div style="font-size: 32px; margin-bottom: 12px;">💝</div>
                              <h3 style="color: #9d174d; margin: 0 0 8px 0; font-size: 16px;">Refer Friends</h3>
                              <p style="color: #be185d; margin: 0; font-size: 14px;">Earn bonus points for referrals</p>
                            </div>
                          </td>
                        </tr>
                      </table>

                      <!-- CTA Button -->
                      <div style="text-align: center; margin: 30px 0;">
                        <a href="${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovable.app') || '#'}" 
                           style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);">
                          Start Shopping Now →
                        </a>
                      </div>

                      <!-- Welcome Gift -->
                      <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 12px; padding: 24px; text-align: center; margin: 30px 0;">
                        <div style="font-size: 40px; margin-bottom: 12px;">🎁</div>
                        <h3 style="color: #92400e; margin: 0 0 8px 0;">Welcome Bonus!</h3>
                        <p style="color: #a16207; margin: 0; font-size: 16px;">
                          You've earned <strong>100 loyalty points</strong> just for signing up!<br>
                          <span style="font-size: 14px;">Use them on your first order.</span>
                        </p>
                      </div>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                      <p style="color: #6b7280; font-size: 14px; margin: 0 0 8px 0;">
                        Need help? Reply to this email or visit our support page.
                      </p>
                      <div style="margin: 16px 0;">
                        <a href="#" style="color: #6366f1; text-decoration: none; margin: 0 8px;">Facebook</a>
                        <span style="color: #d1d5db;">•</span>
                        <a href="#" style="color: #6366f1; text-decoration: none; margin: 0 8px;">Instagram</a>
                        <span style="color: #d1d5db;">•</span>
                        <a href="#" style="color: #6366f1; text-decoration: none; margin: 0 8px;">Twitter</a>
                      </div>
                      <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                        © 2024-2026 Marketplace Nepal Pvt. Ltd.<br>
                        New Road, Kathmandu, Nepal
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "Marketplace <onboarding@resend.dev>",
      to: [userEmail],
      subject: "🎉 Welcome to Marketplace Nepal! Your account is ready",
      html: emailHtml,
    });

    console.log("Welcome email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-welcome-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
