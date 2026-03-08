import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

const ALLOWED_DOMAINS = [
  'https://marketplace-gzn.lovable.app',
  'https://id-preview--eeb5059f-282a-4907-ac64-468155453af8.lovable.app',
];

function isAllowedResetLink(link: string): boolean {
  try {
    const url = new URL(link);
    return ALLOWED_DOMAINS.some(domain => link.startsWith(domain));
  } catch {
    return false;
  }
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PasswordResetRequest {
  email: string;
  resetLink: string;
  userName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    const token = authHeader.replace('Bearer ', '');
    const authClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: 'Invalid or expired token' }), { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    const { email, resetLink, userName }: PasswordResetRequest = await req.json();

    // Validate resetLink domain to prevent phishing
    if (!isAllowedResetLink(resetLink)) {
      return new Response(JSON.stringify({ error: 'Invalid reset link domain' }), { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    const safeUserName = escapeHtml(userName || 'there');
    const safeEmail = escapeHtml(email);
    // resetLink is validated above; escape for HTML attribute context
    const safeResetLink = escapeHtml(resetLink);

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f3f4f6;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <div style="background: linear-gradient(135deg, #1f2937 0%, #374151 100%); padding: 30px; text-align: center;">
            <div style="font-size: 48px; margin-bottom: 10px;">🔐</div>
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Password Reset Request</h1>
          </div>
          <div style="padding: 30px;">
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">Hi ${safeUserName},</p>
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">We received a request to reset your password. Click the button below to create a new password:</p>
            <div style="text-align: center; margin: 35px 0;">
              <a href="${safeResetLink}" style="display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">Reset My Password</a>
            </div>
            <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 25px 0;">
              <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">If the button doesn't work, copy and paste this link:</p>
              <p style="margin: 0; word-break: break-all;"><a href="${safeResetLink}" style="color: #dc2626; font-size: 14px;">${safeResetLink}</a></p>
            </div>
            <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 20px; border-radius: 0 8px 8px 0; margin: 25px 0;">
              <h3 style="color: #991b1b; margin: 0 0 10px 0; font-size: 14px;">⚠️ Security Notice</h3>
              <ul style="margin: 0; padding-left: 20px; color: #b91c1c; font-size: 14px;">
                <li>This link will expire in 1 hour</li>
                <li>If you didn't request this, ignore this email</li>
                <li>Never share this link with anyone</li>
              </ul>
            </div>
          </div>
          <div style="background-color: #1f2937; padding: 25px; text-align: center;">
            <p style="color: #9ca3af; margin: 0 0 10px 0; font-size: 14px;">This email was sent to ${safeEmail}</p>
            <p style="color: #9ca3af; margin: 0 0 15px 0; font-size: 14px;">Questions? Contact us at <a href="mailto:marketplaceauthentic01@gmail.com" style="color: #fbbf24; text-decoration: none;">marketplaceauthentic01@gmail.com</a></p>
            <p style="color: #6b7280; margin: 0; font-size: 12px;">© 2024-2026 Marketplace Nepal Pvt. Ltd. All Rights Reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "Marketplace <onboarding@resend.dev>",
      to: [email],
      subject: "🔐 Reset Your Marketplace Password",
      html,
    });

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-password-reset function:", error);
    return new Response(JSON.stringify({ error: "An internal error occurred" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
