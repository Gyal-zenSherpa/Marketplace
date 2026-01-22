import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

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

interface OrderStatusEmailRequest {
  orderId: string;
  userEmail: string;
  userName: string;
  status: "approved" | "cancelled";
  orderTotal: number;
  orderItems?: Array<{ name: string; quantity: number; price: number }>;
  cancellationReason?: string;
}

const getStatusEmoji = (status: string) => {
  switch (status) {
    case "approved":
      return "✅";
    case "cancelled":
      return "❌";
    default:
      return "📦";
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "approved":
      return "#10b981";
    case "cancelled":
      return "#ef4444";
    default:
      return "#6b7280";
  }
};

const getStatusTitle = (status: string) => {
  switch (status) {
    case "approved":
      return "Payment Approved - Order Confirmed!";
    case "cancelled":
      return "Order Cancelled";
    default:
      return "Order Update";
  }
};

const getStatusMessage = (status: string, userName: string) => {
  switch (status) {
    case "approved":
      return `Great news, ${userName}! Your payment has been approved and your order is now being processed. We're preparing your items for shipment.`;
    case "cancelled":
      return `Dear ${userName}, we regret to inform you that your order has been cancelled. If you have any questions, please contact our support team.`;
    default:
      return `Hello ${userName}, there's an update on your order.`;
  }
};

const handler = async (req: Request): Promise<Response> => {
  console.log("send-order-status-email function called");
  
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

    const {
      orderId,
      userEmail,
      userName,
      status,
      orderTotal,
      orderItems = [],
      cancellationReason,
    }: OrderStatusEmailRequest = await req.json();

    console.log(`Sending ${status} email for order ${orderId} to ${userEmail}`);

    const statusColor = getStatusColor(status);
    const statusEmoji = getStatusEmoji(status);
    const statusTitle = getStatusTitle(status);
    const statusMessage = getStatusMessage(status, userName);

    const itemsHtml = orderItems.length > 0 ? `
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr style="background-color: #f3f4f6;">
          <th style="padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb;">Item</th>
          <th style="padding: 12px; text-align: center; border-bottom: 1px solid #e5e7eb;">Qty</th>
          <th style="padding: 12px; text-align: right; border-bottom: 1px solid #e5e7eb;">Price</th>
        </tr>
        ${orderItems.map(item => `
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.name}</td>
            <td style="padding: 12px; text-align: center; border-bottom: 1px solid #e5e7eb;">${item.quantity}</td>
            <td style="padding: 12px; text-align: right; border-bottom: 1px solid #e5e7eb;">NPR ${item.price.toLocaleString()}</td>
          </tr>
        `).join('')}
        <tr style="background-color: #f9fafb;">
          <td colspan="2" style="padding: 12px; font-weight: bold;">Total</td>
          <td style="padding: 12px; text-align: right; font-weight: bold;">NPR ${orderTotal.toLocaleString()}</td>
        </tr>
      </table>
    ` : '';

    const cancellationHtml = status === "cancelled" && cancellationReason ? `
      <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <p style="color: #991b1b; margin: 0;"><strong>Reason:</strong> ${cancellationReason}</p>
      </div>
    ` : '';

    const nextStepsHtml = status === "approved" ? `
      <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <h3 style="color: #166534; margin: 0 0 12px 0;">What's Next?</h3>
        <ul style="color: #166534; margin: 0; padding-left: 20px;">
          <li>Your order is being prepared for shipment</li>
          <li>You'll receive a shipping notification with tracking details</li>
          <li>Estimated delivery: 3-5 business days</li>
        </ul>
      </div>
    ` : `
      <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <h3 style="color: #1e40af; margin: 0 0 12px 0;">Need Help?</h3>
        <p style="color: #1e40af; margin: 0;">If you believe this was a mistake or have questions, please contact our support team.</p>
      </div>
    `;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${statusTitle}</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, ${statusColor} 0%, ${statusColor}dd 100%); padding: 40px 30px; text-align: center;">
                      <div style="font-size: 48px; margin-bottom: 16px;">${statusEmoji}</div>
                      <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">${statusTitle}</h1>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px 30px;">
                      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                        ${statusMessage}
                      </p>

                      <!-- Order Details -->
                      <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0;">
                        <h3 style="color: #111827; margin: 0 0 12px 0;">Order Details</h3>
                        <p style="color: #6b7280; margin: 0;">
                          <strong>Order ID:</strong> ${orderId.slice(0, 8).toUpperCase()}<br>
                          <strong>Total:</strong> NPR ${orderTotal.toLocaleString()}
                        </p>
                      </div>

                      ${itemsHtml}
                      ${cancellationHtml}
                      ${nextStepsHtml}
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                      <p style="color: #6b7280; font-size: 14px; margin: 0 0 8px 0;">
                        Thank you for shopping with us!
                      </p>
                      <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                        Marketplace Nepal Pvt. Ltd.<br>
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
      subject: `${statusEmoji} ${statusTitle} - Order #${orderId.slice(0, 8).toUpperCase()}`,
      html: emailHtml,
    });

    console.log("Order status email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-order-status-email function:", error);
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
