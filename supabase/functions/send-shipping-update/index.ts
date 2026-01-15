import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ShippingUpdateRequest {
  orderId: string;
  userEmail: string;
  userName: string;
  status: "processing" | "shipped" | "out_for_delivery" | "delivered";
  trackingNumber?: string;
  estimatedDelivery?: string;
  shippingAddress: {
    fullName: string;
    address: string;
    city: string;
  };
}

const statusConfig = {
  processing: {
    emoji: "📦",
    title: "Order Processing",
    message: "We're preparing your order for shipment.",
    color: "#f59e0b",
    bgColor: "#fffbeb",
  },
  shipped: {
    emoji: "🚚",
    title: "Order Shipped!",
    message: "Your order is on its way to you.",
    color: "#3b82f6",
    bgColor: "#eff6ff",
  },
  out_for_delivery: {
    emoji: "🏃",
    title: "Out for Delivery",
    message: "Your order will arrive today!",
    color: "#8b5cf6",
    bgColor: "#f5f3ff",
  },
  delivered: {
    emoji: "✅",
    title: "Order Delivered!",
    message: "Your order has been delivered successfully.",
    color: "#10b981",
    bgColor: "#ecfdf5",
  },
};

const handler = async (req: Request): Promise<Response> => {
  console.log("send-shipping-update function invoked");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      orderId,
      userEmail,
      userName,
      status,
      trackingNumber,
      estimatedDelivery,
      shippingAddress,
    }: ShippingUpdateRequest = await req.json();

    console.log(`Sending shipping update for order ${orderId} - Status: ${status}`);

    const config = statusConfig[status];

    const progressSteps = [
      { label: "Order Placed", active: true },
      { label: "Processing", active: ["processing", "shipped", "out_for_delivery", "delivered"].includes(status) },
      { label: "Shipped", active: ["shipped", "out_for_delivery", "delivered"].includes(status) },
      { label: "Out for Delivery", active: ["out_for_delivery", "delivered"].includes(status) },
      { label: "Delivered", active: status === "delivered" },
    ];

    const progressHtml = progressSteps
      .map(
        (step, index) => `
        <div style="display: flex; flex-direction: column; align-items: center; flex: 1;">
          <div style="width: 24px; height: 24px; border-radius: 50%; background-color: ${step.active ? config.color : '#e5e7eb'}; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px; font-weight: bold;">
            ${step.active ? "✓" : index + 1}
          </div>
          <p style="font-size: 10px; color: ${step.active ? config.color : '#9ca3af'}; margin: 5px 0 0 0; text-align: center;">${step.label}</p>
        </div>
        ${index < progressSteps.length - 1 ? `<div style="flex: 1; height: 2px; background-color: ${progressSteps[index + 1].active ? config.color : '#e5e7eb'}; margin-top: 12px;"></div>` : ''}
      `
      )
      .join("");

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f3f4f6;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, ${config.color} 0%, ${config.color}dd 100%); padding: 30px; text-align: center;">
            <div style="font-size: 48px; margin-bottom: 10px;">${config.emoji}</div>
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">${config.title}</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">${config.message}</p>
          </div>

          <!-- Content -->
          <div style="padding: 30px;">
            <p style="color: #374151; font-size: 16px;">Hi ${userName || 'Valued Customer'},</p>
            
            <!-- Order Info -->
            <div style="background-color: ${config.bgColor}; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <p style="margin: 0 0 10px 0; color: #374151;"><strong>Order ID:</strong> #${orderId.slice(0, 8).toUpperCase()}</p>
              ${trackingNumber ? `<p style="margin: 0 0 10px 0; color: #374151;"><strong>Tracking Number:</strong> ${trackingNumber}</p>` : ''}
              ${estimatedDelivery ? `<p style="margin: 0; color: #374151;"><strong>Estimated Delivery:</strong> ${estimatedDelivery}</p>` : ''}
            </div>

            <!-- Progress Tracker -->
            <div style="margin: 30px 0;">
              <h3 style="color: #1f2937; font-size: 16px; margin-bottom: 20px;">Order Progress</h3>
              <div style="display: flex; align-items: flex-start; justify-content: space-between;">
                ${progressHtml}
              </div>
            </div>

            <!-- Shipping Address -->
            <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-top: 20px;">
              <h3 style="color: #374151; font-size: 14px; margin: 0 0 10px 0; text-transform: uppercase;">Shipping To</h3>
              <p style="margin: 0; color: #1f2937; line-height: 1.6;">
                ${shippingAddress.fullName}<br>
                ${shippingAddress.address}<br>
                ${shippingAddress.city}
              </p>
            </div>

            ${status === 'delivered' ? `
            <!-- Review Prompt -->
            <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 20px; border-radius: 8px; margin-top: 25px; text-align: center;">
              <p style="margin: 0 0 10px 0; color: #92400e; font-weight: 600;">⭐ How was your experience?</p>
              <p style="margin: 0; color: #a16207; font-size: 14px;">We'd love to hear your feedback! Please leave a review for your purchased items.</p>
            </div>
            ` : ''}
          </div>

          <!-- Footer -->
          <div style="background-color: #1f2937; padding: 25px; text-align: center;">
            <p style="color: #9ca3af; margin: 0 0 10px 0; font-size: 14px;">Need help? Contact us at</p>
            <p style="margin: 0;">
              <a href="mailto:marketplaceauthentic01@gmail.com" style="color: #fbbf24; text-decoration: none;">marketplaceauthentic01@gmail.com</a>
              <span style="color: #6b7280;"> | </span>
              <a href="tel:9763689295" style="color: #fbbf24; text-decoration: none;">9763689295</a>
            </p>
            <p style="color: #6b7280; margin: 15px 0 0 0; font-size: 12px;">
              © 2024-2026 Marketplace Nepal Pvt. Ltd. All Rights Reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "Marketplace <onboarding@resend.dev>",
      to: [userEmail],
      subject: `${config.emoji} ${config.title} - Order #${orderId.slice(0, 8).toUpperCase()}`,
      html,
    });

    console.log("Shipping update email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-shipping-update function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
