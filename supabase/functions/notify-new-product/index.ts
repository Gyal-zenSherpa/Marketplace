import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Verify JWT authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const authClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;

    // 2. Verify admin role
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: isAdmin } = await supabaseAdmin.rpc('has_role', {
      _user_id: userId,
      _role: 'admin',
    });

    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Parse and sanitize input
    const { productName, productBrand, productCategory, productPrice, productImage } = await req.json();

    const safeName = escapeHtml(String(productName || ''));
    const safeBrand = escapeHtml(String(productBrand || ''));
    const safeCategory = escapeHtml(String(productCategory || ''));
    const safePrice = escapeHtml(String(productPrice || ''));

    // Validate image URL if provided
    let safeImageHtml = '';
    if (productImage) {
      try {
        const imgUrl = new URL(String(productImage));
        if (['http:', 'https:'].includes(imgUrl.protocol)) {
          safeImageHtml = `<img src="${escapeHtml(imgUrl.href)}" alt="${safeName}" style="width: 100%; max-height: 300px; object-fit: cover; border-radius: 8px; margin-bottom: 16px;" />`;
        }
      } catch {
        // Invalid URL, skip image
      }
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      return new Response(JSON.stringify({ error: "RESEND_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch all user emails from auth.users via admin API
    const allEmails: string[] = [];
    let page = 1;
    const perPage = 1000;

    while (true) {
      const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage,
      });

      if (error || !users || users.length === 0) break;

      for (const user of users) {
        if (user.email) allEmails.push(user.email);
      }

      if (users.length < perPage) break;
      page++;
    }

    if (allEmails.length === 0) {
      return new Response(JSON.stringify({ message: "No users to notify" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Send email in batches
    const batchSize = 50;
    let sentCount = 0;

    for (let i = 0; i < allEmails.length; i += batchSize) {
      const batch = allEmails.slice(i, i + batchSize);

      const emailRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: "Marketplace <onboarding@resend.dev>",
          bcc: batch,
          to: "noreply@marketplace.com",
          subject: `🆕 New Product Alert: ${safeName} by ${safeBrand}!`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #333; text-align: center;">🛍️ New Product Just Added!</h1>
              <div style="background: #f9f9f9; border-radius: 12px; padding: 24px; margin: 20px 0;">
                ${safeImageHtml}
                <h2 style="color: #333; margin: 0 0 8px;">${safeName}</h2>
                <p style="color: #666; margin: 0 0 8px;">Brand: <strong>${safeBrand}</strong></p>
                <p style="color: #666; margin: 0 0 8px;">Category: ${safeCategory}</p>
                <p style="color: #333; font-size: 24px; font-weight: bold; margin: 16px 0;">Rs. ${safePrice}</p>
                <a href="https://marketplace-gzn.lovable.app" style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Shop Now</a>
              </div>
              <p style="color: #999; font-size: 12px; text-align: center;">You received this because you're a registered user of Marketplace.</p>
            </div>
          `,
        }),
      });

      if (emailRes.ok) {
        sentCount += batch.length;
      } else {
        console.error("Email batch failed:", await emailRes.text());
      }
    }

    return new Response(
      JSON.stringify({ message: `Notifications sent to ${sentCount} users` }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "An internal error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
