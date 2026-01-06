import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Package, Clock, CheckCircle, Truck, XCircle, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { OrderInvoice } from "@/components/orders/OrderInvoice";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface OrderItem {
  id: string;
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
    phone?: string;
    paymentMethod?: string;
  } | null;
  payment_proof_url: string | null;
  order_items: OrderItem[];
}

const STATUS_CONFIG: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  pending: { icon: <Clock className="h-4 w-4" />, color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20", label: "Pending" },
  processing: { icon: <Package className="h-4 w-4" />, color: "bg-blue-500/10 text-blue-600 border-blue-500/20", label: "Processing" },
  shipped: { icon: <Truck className="h-4 w-4" />, color: "bg-purple-500/10 text-purple-600 border-purple-500/20", label: "Shipped" },
  delivered: { icon: <CheckCircle className="h-4 w-4" />, color: "bg-green-500/10 text-green-600 border-green-500/20", label: "Delivered" },
  cancelled: { icon: <XCircle className="h-4 w-4" />, color: "bg-red-500/10 text-red-600 border-red-500/20", label: "Cancelled" },
};

export default function Orders() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    const fetchOrders = async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          id,
          total,
          status,
          created_at,
          shipping_address,
          payment_proof_url,
          order_items (
            id,
            product_name,
            product_price,
            quantity
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setOrders(data as Order[]);
      }
      setLoading(false);
    };

    fetchOrders();

    // Subscribe to real-time order updates
    const channel = supabase
      .channel("orders-updates")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setOrders((prev) =>
            prev.map((order) =>
              order.id === payload.new.id
                ? { ...order, status: payload.new.status }
                : order
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, navigate]);

  const openOrderDetail = (order: Order) => {
    setSelectedOrder(order);
    setDetailOpen(true);
  };

  const formatPrice = (price: number) => `Rs. ${price.toFixed(2)}`;

  const getStatusConfig = (status: string) => {
    return STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </button>

        <div className="flex items-center gap-4 mb-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl gradient-hero">
            <Package className="h-7 w-7 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">My Orders</h1>
            <p className="text-muted-foreground">Track your orders and view purchase history</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : orders.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Package className="h-16 w-16 text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">No orders yet</h2>
              <p className="text-muted-foreground mb-4">Start shopping to see your orders here</p>
              <Button onClick={() => navigate("/")}>Browse Products</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const statusConfig = getStatusConfig(order.status);
              return (
                <Card key={order.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-sm text-muted-foreground">
                            Order #{order.id.slice(0, 8).toUpperCase()}
                          </span>
                          <Badge variant="outline" className={statusConfig.color}>
                            {statusConfig.icon}
                            <span className="ml-1">{statusConfig.label}</span>
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Placed on {format(new Date(order.created_at), "MMMM d, yyyy 'at' h:mm a")}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {order.order_items.length} item{order.order_items.length > 1 ? "s" : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-xl font-bold text-foreground">{formatPrice(order.total)}</p>
                          <p className="text-sm text-muted-foreground capitalize">
                            {order.shipping_address?.paymentMethod === "online" ? "Online Payment" : "Cash on Delivery"}
                          </p>
                        </div>
                        <Button variant="outline" onClick={() => openOrderDetail(order)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                        <OrderInvoice order={order} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
      <Footer />

      {/* Order Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              {/* Status Timeline */}
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  {getStatusConfig(selectedOrder.status).icon}
                  <span className="font-medium">{getStatusConfig(selectedOrder.status).label}</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  Order #{selectedOrder.id.slice(0, 8).toUpperCase()}
                </span>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="font-semibold mb-3">Items</h3>
                <div className="space-y-3">
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

              {/* Shipping Address */}
              {selectedOrder.shipping_address && (
                <div>
                  <h3 className="font-semibold mb-3">Shipping Address</h3>
                  <div className="p-3 bg-secondary/50 rounded-lg">
                    <p className="font-medium">{selectedOrder.shipping_address.fullName}</p>
                    <p className="text-sm text-muted-foreground">{selectedOrder.shipping_address.address}</p>
                    <p className="text-sm text-muted-foreground">{selectedOrder.shipping_address.city}</p>
                    <p className="text-sm text-muted-foreground">{selectedOrder.shipping_address.phone}</p>
                  </div>
                </div>
              )}

              {/* Payment Proof */}
              {selectedOrder.payment_proof_url && (
                <div>
                  <h3 className="font-semibold mb-3">Payment Proof</h3>
                  <img
                    src={selectedOrder.payment_proof_url}
                    alt="Payment proof"
                    className="w-full max-w-xs rounded-lg border"
                  />
                </div>
              )}

              {/* Total */}
              <div className="flex justify-between items-center pt-4 border-t">
                <span className="font-semibold">Total</span>
                <span className="text-xl font-bold">{formatPrice(selectedOrder.total)}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
