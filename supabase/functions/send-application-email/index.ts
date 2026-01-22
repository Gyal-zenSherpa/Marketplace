import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Helper to decode JWT and extract payload
function decodeJwt(token: string): { sub: string; email: string; exp: number } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    return payload;
  } catch {
    return null;
  }
}

interface ApplicationEmailRequest {
  userId: string;
  businessName: string;
  status: "approved" | "rejected";
  adminNotes?: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("send-application-email function invoked");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error("Missing or invalid authorization header");
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const jwtToken = authHeader.replace('Bearer ', '');
    const jwtPayload = decodeJwt(jwtToken);
    
    if (!jwtPayload || !jwtPayload.sub) {
      console.error("Invalid token payload");
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if token is expired
    if (jwtPayload.exp && jwtPayload.exp * 1000 < Date.now()) {
      console.error("Token expired");
      return new Response(
        JSON.stringify({ error: 'Token expired' }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Authenticated user: ${jwtPayload.sub}`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { userId, businessName, status, adminNotes }: ApplicationEmailRequest = await req.json();

    console.log(`Sending ${status} email for user ${userId}, business: ${businessName}`);

    // Get user email from auth.users
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);

    if (userError || !userData.user?.email) {
      console.error("Error getting user email:", userError);
      return new Response(
        JSON.stringify({ error: "Could not find user email" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const userEmail = userData.user.email;
    console.log(`Sending email to: ${userEmail}`);

    const isApproved = status === "approved";
    const subject = isApproved
      ? `Congratulations! Your Seller Application for "${businessName}" is Approved`
      : `Update on Your Seller Application for "${businessName}"`;

    const html = isApproved
      ? `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #16a34a;">🎉 Congratulations!</h1>
          <p>Your seller application for <strong>${businessName}</strong> has been <span style="color: #16a34a; font-weight: bold;">approved</span>!</p>
          <p>You can now start listing your products on our marketplace.</p>
          ${adminNotes ? `<p><strong>Admin Notes:</strong> ${adminNotes}</p>` : ""}
          <div style="margin-top: 30px; padding: 20px; background-color: #f0fdf4; border-radius: 8px;">
            <h3 style="margin-top: 0;">Next Steps:</h3>
            <ol>
              <li>Log in to your account</li>
              <li>Go to Seller Dashboard</li>
              <li>Start adding your products</li>
            </ol>
          </div>
          <p style="margin-top: 30px; color: #666;">Thank you for joining our marketplace!</p>
        </div>
      `
      : `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #dc2626;">Application Update</h1>
          <p>We regret to inform you that your seller application for <strong>${businessName}</strong> was not approved at this time.</p>
          ${adminNotes ? `<p><strong>Reason:</strong> ${adminNotes}</p>` : ""}
          <div style="margin-top: 30px; padding: 20px; background-color: #fef2f2; border-radius: 8px;">
            <h3 style="margin-top: 0;">What's Next?</h3>
            <p>You can reapply after addressing the feedback provided. If you have questions, please contact our support team.</p>
          </div>
          <p style="margin-top: 30px; color: #666;">Thank you for your interest in our marketplace.</p>
        </div>
      `;

    const emailResponse = await resend.emails.send({
      from: "Marketplace <onboarding@resend.dev>",
      to: [userEmail],
      subject,
      html,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-application-email function:", error);
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
