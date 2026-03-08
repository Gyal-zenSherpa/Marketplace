import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { RefreshCw, Search, Eye } from "lucide-react";

interface OrderItem {
  id: string;
  product_name: string;
  product_price: number;
  quantity: number;
}

interface AdminOrder {
  id: string;
  user_id: string;
  total: number;
  status: string;
  created_at: string;
  shipping_address: {
    fullName?: string;
    address?: string;
    city?: string;
    phone?: string;
    paymentMethod?: string;
    email?: string;
  } | null;
  payment_proof_url: string | null;
  order_items: OrderItem[];
}

const ORDER_STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"];

interface Props {
  statusFilter: string | null;
  onClearFilter: () => void;
}

export function AdminOrdersTab({ statusFilter, onClearFilter }: Props) {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orderSearch, setOrderSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [orderDetailOpen, setOrderDetailOpen] = useState(false);
  const [signedPaymentProofUrl, setSignedPaymentProofUrl] = useState<string | null>(null);

  const extractStoragePath = (url: string, bucket: string): string | null => {
    try {
      const urlObj = new URL(url);
      const pathMatch = urlObj.pathname.match(new RegExp(`/storage/v1/object/public/${bucket}/(.+)`));
      return pathMatch ? decodeURIComponent(pathMatch[1]) : null;
    } catch {
      return null;
    }
  };

  const fetchOrders = async () => {
    setOrdersLoading(true);
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`id, user_id, total, status, created_at, shipping_address, payment_proof_url, order_items (id, product_name, product_price, quantity)`)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      setOrders((data as AdminOrder[]) || []);
    } catch (err) {
      console.error("Error fetching orders:", err);
      toast({ variant: "destructive", title: "Error", description: "Failed to load orders." });
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    const fetchSignedUrl = async () => {
      if (!selectedOrder?.payment_proof_url || !orderDetailOpen) {
        setSignedPaymentProofUrl(null);
        return;
      }
      const path = extractStoragePath(selectedOrder.payment_proof_url, 'payment-proofs');
      if (!path) { setSignedPaymentProofUrl(null); return; }
      const { data, error } = await supabase.storage.from('payment-proofs').createSignedUrl(path, 3600);
      if (error) { setSignedPaymentProofUrl(null); return; }
      setSignedPaymentProofUrl(data.signedUrl);
    };
    fetchSignedUrl();
  }, [selectedOrder, orderDetailOpen]);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase.from("orders").update({ status: newStatus }).eq("id", orderId);
      if (error) throw error;

      const order = orders.find(o => o.id === orderId);

      if (order?.shipping_address) {
        const { data: profile } = await supabase.from("profiles").select("full_name").eq("user_id", order.user_id).single();
        const emailToUse = (order.shipping_address as any)?.email;

        if (emailToUse) {
          if (["processing", "cancelled"].includes(newStatus)) {
            try {
              await supabase.functions.invoke('send-order-status-email', {
                body: {
                  orderId: order.id, userEmail: emailToUse,
                  userName: profile?.full_name || order.shipping_address.fullName || 'Valued Customer',
                  status: newStatus === "processing" ? "approved" : "cancelled",
                  orderTotal: order.total,
                  orderItems: order.order_items?.map(item => ({ name: item.product_name, quantity: item.quantity, price: item.product_price })),
                  cancellationReason: newStatus === "cancelled" ? "Order was cancelled by admin" : undefined,
                },
              });
            } catch (emailErr) { console.error("Failed to send order status email:", emailErr); }
          }
          if (["shipped", "delivered"].includes(newStatus)) {
            try {
              await supabase.functions.invoke('send-shipping-update', {
                body: {
                  orderId: order.id, userEmail: emailToUse,
                  userName: profile?.full_name || order.shipping_address.fullName || 'Valued Customer',
                  status: newStatus as "shipped" | "delivered",
                  estimatedDelivery: newStatus === "shipped" ? "3-5 business days" : undefined,
                  shippingAddress: {
                    fullName: order.shipping_address.fullName || '',
                    address: order.shipping_address.address || '',
                    city: order.shipping_address.city || '',
                  },
                },
              });
            } catch (emailErr) { console.error("Failed to send shipping update email:", emailErr); }
          }
        }
      }

      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));

      // Notifications
      const targetOrder = orders.find(o => o.id === orderId);
      if (targetOrder) {
        const notifMap: Record<string, { title: string; message: string }> = {
          processing: { title: "Order Confirmed ✅", message: `Your order #${orderId.slice(0, 8).toUpperCase()} has been confirmed and is being processed.` },
          shipped: { title: "Order Shipped 🚚", message: `Your order #${orderId.slice(0, 8).toUpperCase()} has been shipped! It should arrive in 3-5 business days.` },
          delivered: { title: "Order Delivered 📦", message: `Your order #${orderId.slice(0, 8).toUpperCase()} has been delivered! Leave a review to help others.` },
          cancelled: { title: "Order Cancelled ❌", message: `Your order #${orderId.slice(0, 8).toUpperCase()} has been cancelled.` },
        };
        const notif = notifMap[newStatus];
        if (notif) {
          await supabase.from("user_notifications").insert({
            user_id: targetOrder.user_id, title: notif.title, message: notif.message, type: "order", link: "/orders",
          });
        }
      }

      // Commission on delivered
      if (newStatus === "delivered" && targetOrder) {
        try {
          const { data: orderItems } = await supabase
            .from("order_items")
            .select("id, product_name, product_price, quantity, product_id")
            .eq("order_id", orderId);

          if (orderItems) {
            const { data: graceConfig } = await supabase.from("commission_config").select("value").eq("key", "grace_period_days").single();
            const graceDays = parseInt(graceConfig?.value || "30");
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + graceDays);

            for (const item of orderItems) {
              let sellerId: string | null = null;
              if (item.product_id) {
                const { data: product } = await supabase.from("products").select("seller_id").eq("id", item.product_id).single();
                sellerId = product?.seller_id || null;
              }
              if (!sellerId) continue;

              const { data: rateData } = await supabase.rpc("get_seller_commission_rate", { p_seller_id: sellerId });
              const commissionRate = rateData ?? 10;
              const salePrice = item.product_price * item.quantity;
              const taxAmount = salePrice * 0.1;
              const postTaxAmount = salePrice - taxAmount;
              const commissionAmount = postTaxAmount * (commissionRate / 100);
              const netToSeller = postTaxAmount - commissionAmount;

              const { data: existing } = await supabase.from("commission_transactions").select("id").eq("order_id", orderId).eq("order_item_id", item.id).maybeSingle();
              if (!existing) {
                await supabase.from("commission_transactions").insert({
                  order_id: orderId, order_item_id: item.id, seller_id: sellerId,
                  product_name: item.product_name, sale_price: salePrice, tax_amount: taxAmount,
                  post_tax_amount: postTaxAmount, commission_rate: commissionRate,
                  commission_amount: commissionAmount, net_to_seller: netToSeller,
                  payment_status: "pending", payment_due_date: dueDate.toISOString(),
                });
                await supabase.from("user_notifications").insert({
                  user_id: sellerId, title: "Commission Recorded 📊",
                  message: `Commission of Rs. ${commissionAmount.toFixed(0)} (${commissionRate}%) recorded for "${item.product_name}". Due by ${dueDate.toLocaleDateString()}.`,
                  type: "commission", link: "/seller-dashboard?tab=commission",
                });
              }
            }
          }
        } catch (commErr) { console.error("Failed to calculate commission:", commErr); }
      }

      toast({ title: "Order updated", description: `Order status changed to ${newStatus}.` });
    } catch (err) {
      console.error("Error updating order:", err);
      toast({ variant: "destructive", title: "Error", description: "Failed to update order status." });
    }
  };

  const filteredOrders = orders.filter((order) => {
    const search = orderSearch.toLowerCase();
    const matchesSearch = order.id.toLowerCase().includes(search) || order.status.toLowerCase().includes(search) || order.shipping_address?.fullName?.toLowerCase().includes(search);
    const matchesStatus = statusFilter ? order.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  const formatPrice = (price: number) => `Rs. ${price.toFixed(2)}`;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Order Management</CardTitle>
              <CardDescription>View and manage customer orders</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {statusFilter && (
                <Badge variant="secondary" className="gap-1">
                  Filtered: {statusFilter}
                  <button onClick={onClearFilter} className="ml-1 hover:text-destructive">×</button>
                </Badge>
              )}
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search orders..." value={orderSearch} onChange={(e) => setOrderSearch(e.target.value)} className="pl-9 w-full md:w-64" />
              </div>
              <Button variant="outline" size="icon" onClick={fetchOrders} disabled={ordersLoading}>
                <RefreshCw className={`h-4 w-4 ${ordersLoading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead className="hidden md:table-cell">Payment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      {ordersLoading ? "Loading orders..." : "No orders found"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-xs">#{order.id.slice(0, 8).toUpperCase()}</TableCell>
                      <TableCell className="font-medium">{order.shipping_address?.fullName || "—"}</TableCell>
                      <TableCell>{formatPrice(order.total)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {order.shipping_address?.paymentMethod === "online" ? "Online" : "COD"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Select value={order.status} onValueChange={(value) => updateOrderStatus(order.id, value)}>
                          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {ORDER_STATUSES.map((status) => (
                              <SelectItem key={status} value={status}><span className="capitalize">{status}</span></SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">{format(new Date(order.created_at), "MMM d, yyyy")}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => { setSelectedOrder(order); setOrderDetailOpen(true); }}>
                          <Eye className="h-4 w-4 mr-1" /> View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Order Detail Dialog */}
      <Dialog open={orderDetailOpen} onOpenChange={setOrderDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>Order #{selectedOrder?.id.slice(0, 8).toUpperCase()}</DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Customer</h4>
                  <div className="bg-muted rounded-lg p-3 text-sm">
                    <p className="font-medium">{selectedOrder.shipping_address?.fullName}</p>
                    <p className="text-muted-foreground">{selectedOrder.shipping_address?.phone}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Shipping Address</h4>
                  <div className="bg-muted rounded-lg p-3 text-sm text-muted-foreground">
                    <p>{selectedOrder.shipping_address?.address}</p>
                    <p>{selectedOrder.shipping_address?.city}</p>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Items</h4>
                <div className="space-y-2">
                  {selectedOrder.order_items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center p-3 bg-secondary/50 rounded-lg">
                      <div>
                        <p className="font-medium">{item.product_name}</p>
                        <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-medium">{formatPrice(item.product_price * item.quantity)}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Payment Method</h4>
                  <Badge variant="outline">{selectedOrder.shipping_address?.paymentMethod === "online" ? "Online Payment" : "Cash on Delivery"}</Badge>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Status</h4>
                  <Select value={selectedOrder.status} onValueChange={(value) => { updateOrderStatus(selectedOrder.id, value); setSelectedOrder({ ...selectedOrder, status: value }); }}>
                    <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ORDER_STATUSES.map((status) => (<SelectItem key={status} value={status}><span className="capitalize">{status}</span></SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {selectedOrder.payment_proof_url && (
                <div>
                  <h4 className="font-semibold mb-2">Payment Proof</h4>
                  {signedPaymentProofUrl ? (
                    <a href={signedPaymentProofUrl} target="_blank" rel="noopener noreferrer">
                      <img src={signedPaymentProofUrl} alt="Payment proof" className="w-full max-w-xs rounded-lg border hover:opacity-90 transition-opacity cursor-pointer" />
                    </a>
                  ) : (
                    <div className="flex items-center justify-center h-32 bg-muted rounded-md">
                      <p className="text-sm text-muted-foreground">Loading payment proof...</p>
                    </div>
                  )}
                </div>
              )}
              <div className="flex justify-between items-center pt-4 border-t">
                <span className="font-semibold text-lg">Total</span>
                <span className="text-2xl font-bold">{formatPrice(selectedOrder.total)}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
