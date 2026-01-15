import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface OrderItem {
  product_name: string;
  quantity: number;
  product_price: number;
}

interface OrderConfirmationRequest {
  orderId: string;
  userEmail: string;
  userName: string;
  orderItems: OrderItem[];
  total: number;
  shippingAddress: {
    fullName: string;
    address: string;
    city: string;
    postalCode: string;
    phone: string;
  };
  paymentMethod: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("send-order-confirmation function invoked");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      orderId,
      userEmail,
      userName,
      orderItems,
      total,
      shippingAddress,
      paymentMethod,
    }: OrderConfirmationRequest = await req.json();

    console.log(`Sending order confirmation for order ${orderId} to ${userEmail}`);

    const itemsHtml = orderItems
      .map(
        (item) => `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.product_name}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">Rs. ${item.product_price.toLocaleString()}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">Rs. ${(item.quantity * item.product_price).toLocaleString()}</td>
        </tr>
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
          <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🎉 Order Confirmed!</h1>
            <p style="color: #fecaca; margin: 10px 0 0 0;">Thank you for your purchase, ${userName || 'Valued Customer'}!</p>
          </div>

          <!-- Order Details -->
          <div style="padding: 30px;">
            <div style="background-color: #fef2f2; border-radius: 8px; padding: 15px; margin-bottom: 25px;">
              <p style="margin: 0; color: #991b1b; font-weight: 600;">Order ID: #${orderId.slice(0, 8).toUpperCase()}</p>
            </div>

            <!-- Items Table -->
            <h2 style="color: #1f2937; font-size: 18px; margin-bottom: 15px;">Order Summary</h2>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
              <thead>
                <tr style="background-color: #f9fafb;">
                  <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151;">Item</th>
                  <th style="padding: 12px; text-align: center; font-weight: 600; color: #374151;">Qty</th>
                  <th style="padding: 12px; text-align: right; font-weight: 600; color: #374151;">Price</th>
                  <th style="padding: 12px; text-align: right; font-weight: 600; color: #374151;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="3" style="padding: 15px 12px; text-align: right; font-weight: 700; color: #1f2937; font-size: 18px;">Grand Total:</td>
                  <td style="padding: 15px 12px; text-align: right; font-weight: 700; color: #dc2626; font-size: 18px;">Rs. ${total.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>

            <!-- Shipping Address -->
            <div style="display: flex; gap: 20px; flex-wrap: wrap;">
              <div style="flex: 1; min-width: 200px; background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 15px;">
                <h3 style="color: #374151; font-size: 14px; margin: 0 0 10px 0; text-transform: uppercase;">Shipping Address</h3>
                <p style="margin: 0; color: #1f2937; line-height: 1.6;">
                  ${shippingAddress.fullName}<br>
                  ${shippingAddress.address}<br>
                  ${shippingAddress.city}, ${shippingAddress.postalCode}<br>
                  📞 ${shippingAddress.phone}
                </p>
              </div>
              <div style="flex: 1; min-width: 200px; background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 15px;">
                <h3 style="color: #374151; font-size: 14px; margin: 0 0 10px 0; text-transform: uppercase;">Payment Method</h3>
                <p style="margin: 0; color: #1f2937;">${paymentMethod === 'cod' ? '💵 Cash on Delivery' : '📱 Online Payment'}</p>
              </div>
            </div>

            <!-- Next Steps -->
            <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 20px; border-radius: 0 8px 8px 0; margin-top: 25px;">
              <h3 style="color: #065f46; margin: 0 0 10px 0;">What's Next?</h3>
              <ul style="margin: 0; padding-left: 20px; color: #047857;">
                <li>We're preparing your order for shipment</li>
                <li>You'll receive a shipping notification with tracking details</li>
                <li>Expected delivery: 2-5 business days (Kathmandu Valley)</li>
              </ul>
            </div>
          </div>

          <!-- Footer -->
          <div style="background-color: #1f2937; padding: 25px; text-align: center;">
            <p style="color: #9ca3af; margin: 0 0 10px 0; font-size: 14px;">Questions? Contact us at</p>
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
      subject: `🎉 Order Confirmed - #${orderId.slice(0, 8).toUpperCase()}`,
      html,
    });

    console.log("Order confirmation email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-order-confirmation function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
