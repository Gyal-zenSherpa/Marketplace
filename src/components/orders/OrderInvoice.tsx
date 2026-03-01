import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { format } from "date-fns";
import { formatNepaliPrice } from "@/lib/formatNepali";

interface OrderItem {
  product_name: string;
  product_price: number;
  quantity: number;
}

interface Order {
  id: string;
  total: number;
  status: string;
  created_at: string;
  shipping_address: {
    fullName?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    phone?: string;
    paymentMethod?: string;
  } | null;
  order_items: OrderItem[];
}

interface OrderInvoiceProps {
  order: Order;
}

export function OrderInvoice({ order }: OrderInvoiceProps) {
  const generateInvoice = () => {
    const invoiceContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Invoice - ${order.id.slice(0, 8).toUpperCase()}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
    .header { text-align: center; margin-bottom: 40px; }
    .header h1 { color: #333; margin-bottom: 5px; }
    .header p { color: #666; }
    .info-section { display: flex; justify-content: space-between; margin-bottom: 30px; }
    .info-box { flex: 1; }
    .info-box h3 { color: #333; margin-bottom: 10px; font-size: 14px; text-transform: uppercase; }
    .info-box p { color: #666; margin: 5px 0; font-size: 14px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    th { background: #f5f5f5; padding: 12px; text-align: left; font-size: 14px; border-bottom: 2px solid #ddd; }
    td { padding: 12px; border-bottom: 1px solid #eee; font-size: 14px; }
    .total-row td { font-weight: bold; font-size: 16px; border-top: 2px solid #333; }
    .footer { text-align: center; color: #999; font-size: 12px; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>INVOICE</h1>
    <p>Order #${order.id.slice(0, 8).toUpperCase()}</p>
    <p>${format(new Date(order.created_at), "MMMM d, yyyy 'at' h:mm a")}</p>
  </div>
  
  <div class="info-section">
    <div class="info-box">
      <h3>Bill To</h3>
      <p><strong>${order.shipping_address?.fullName || "—"}</strong></p>
      <p>${order.shipping_address?.address || ""}</p>
      <p>${order.shipping_address?.city || ""}, ${order.shipping_address?.state || ""} ${order.shipping_address?.zipCode || ""}</p>
      <p>Phone: ${order.shipping_address?.phone || "—"}</p>
    </div>
    <div class="info-box" style="text-align: right;">
      <h3>Payment Method</h3>
      <p>${order.shipping_address?.paymentMethod === "online" ? "Online Payment" : "Cash on Delivery"}</p>
      <h3 style="margin-top: 20px;">Status</h3>
      <p style="text-transform: capitalize;">${order.status}</p>
    </div>
  </div>
  
  <table>
    <thead>
      <tr>
        <th>Item</th>
        <th style="text-align: center;">Qty</th>
        <th style="text-align: right;">Price</th>
        <th style="text-align: right;">Total</th>
      </tr>
    </thead>
    <tbody>
      ${order.order_items
        .map(
          (item) => `
        <tr>
          <td>${item.product_name}</td>
          <td style="text-align: center;">${item.quantity}</td>
          <td style="text-align: right;">${formatNepaliPrice(item.product_price)}</td>
          <td style="text-align: right;">${formatNepaliPrice(item.product_price * item.quantity)}</td>
        </tr>
      `
        )
        .join("")}
      <tr class="total-row">
        <td colspan="3" style="text-align: right;">Grand Total</td>
        <td style="text-align: right;">${formatNepaliPrice(order.total)}</td>
      </tr>
    </tbody>
  </table>
  
  <div class="footer">
    <p>Thank you for your purchase!</p>
    <p>For any queries, please contact our customer support.</p>
  </div>
</body>
</html>
    `;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(invoiceContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={generateInvoice}>
      <FileText className="h-4 w-4 mr-2" />
      Invoice
    </Button>
  );
}
