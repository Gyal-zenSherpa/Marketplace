import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Package, Clock, CheckCircle, Truck, XCircle, Eye, MapPin, Phone, User, CreditCard, Banknote } from "lucide-react";
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

function PaymentProofDisplay({ paymentProofPath }: { paymentProofPath: string }) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchUrl = async () => {
      // Extract path from full URL if needed
      let path = paymentProofPath;
      const marker = '/object/public/payment-proofs/';
      const idx = path.indexOf(marker);
      if (idx !== -1) {
        path = path.substring(idx + marker.length);
      }
      const signedMarker = '/object/sign/payment-proofs/';
      const signedIdx = path.indexOf(signedMarker);
      if (signedIdx !== -1) {
        path = path.substring(signedIdx + signedMarker.length).split('?')[0];
      }

      const { data, error } = await supabase.storage
        .from('payment-proofs')
        .createSignedUrl(path, 3600);

      if (!error && data) {
        setSignedUrl(data.signedUrl);
      }
    };
    fetchUrl();
  }, [paymentProofPath]);

  return (
    <div>
      <h3 className="font-semibold mb-3 flex items-center gap-2">
        <CreditCard className="h-4 w-4 text-muted-foreground" />
        Payment Proof
      </h3>
      <div className="p-3 bg-muted/30 rounded-xl border border-border/50">
        {signedUrl ? (
          <img
            src={signedUrl}
            alt="Payment proof"
            className="w-full max-w-xs rounded-lg border shadow-sm mx-auto"
          />
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">Loading payment proof...</p>
        )}
        <p className="text-xs text-center text-muted-foreground mt-2">
          Payment screenshot uploaded
        </p>
      </div>
    </div>
  );
}

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

const STATUS_CONFIG: Record<string, { icon: React.ReactNode; color: string; label: string; bgColor: string }> = {
  pending: { icon: <Clock className="h-4 w-4" />, color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20", label: "Pending", bgColor: "from-yellow-500/20 to-yellow-600/20" },
  processing: { icon: <Package className="h-4 w-4" />, color: "bg-blue-500/10 text-blue-600 border-blue-500/20", label: "Processing", bgColor: "from-blue-500/20 to-blue-600/20" },
  shipped: { icon: <Truck className="h-4 w-4" />, color: "bg-purple-500/10 text-purple-600 border-purple-500/20", label: "Shipped", bgColor: "from-purple-500/20 to-purple-600/20" },
  delivered: { icon: <CheckCircle className="h-4 w-4" />, color: "bg-green-500/10 text-green-600 border-green-500/20", label: "Delivered", bgColor: "from-green-500/20 to-green-600/20" },
  cancelled: { icon: <XCircle className="h-4 w-4" />, color: "bg-red-500/10 text-red-600 border-red-500/20", label: "Cancelled", bgColor: "from-red-500/20 to-red-600/20" },
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
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                        <div className="text-left sm:text-right">
                          <p className="text-lg sm:text-xl font-bold text-foreground">{formatPrice(order.total)}</p>
                          <p className="text-xs sm:text-sm text-muted-foreground capitalize">
                            {order.shipping_address?.paymentMethod === "online" ? "Online Payment" : "Cash on Delivery"}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => openOrderDetail(order)}>
                            <Eye className="h-4 w-4 mr-1" />
                            <span className="hidden sm:inline">View Details</span>
                            <span className="sm:hidden">View</span>
                          </Button>
                          <OrderInvoice order={order} />
                        </div>
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
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Order Details
            </DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              {/* Status Timeline with gradient background */}
              <div className={`flex items-center justify-between p-4 rounded-xl bg-gradient-to-r ${getStatusConfig(selectedOrder.status).bgColor} border`}>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm">
                    {getStatusConfig(selectedOrder.status).icon}
                  </div>
                  <div>
                    <span className="font-semibold text-lg">{getStatusConfig(selectedOrder.status).label}</span>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(selectedOrder.created_at), "MMMM d, yyyy 'at' h:mm a")}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="font-mono">
                  #{selectedOrder.id.slice(0, 8).toUpperCase()}
                </Badge>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  Items ({selectedOrder.order_items.length})
                </h3>
                <div className="space-y-2">
                  {selectedOrder.order_items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg border border-border/50">
                      <div>
                        <p className="font-medium">{item.product_name}</p>
                        <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-semibold">{formatPrice(item.product_price * item.quantity)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipping Address with enhanced styling */}
              {selectedOrder.shipping_address && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    Shipping Details
                  </h3>
                  <div className="p-4 bg-gradient-to-br from-muted/50 to-muted/30 rounded-xl border border-border/50 space-y-3">
                    {/* Customer Name */}
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Customer</p>
                        <p className="font-medium">{selectedOrder.shipping_address.fullName}</p>
                      </div>
                    </div>

                    {/* Address with location icon */}
                    {selectedOrder.shipping_address.address && (
                      <div className="flex items-start gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/10">
                          <MapPin className="h-4 w-4 text-blue-500" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">Delivery Address</p>
                          <p className="font-medium">{selectedOrder.shipping_address.address}</p>
                          {selectedOrder.shipping_address.city && (
                            <p className="text-sm text-muted-foreground">{selectedOrder.shipping_address.city}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Phone */}
                    {selectedOrder.shipping_address.phone && (
                      <div className="flex items-start gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/10">
                          <Phone className="h-4 w-4 text-green-500" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">Contact</p>
                          <p className="font-medium">{selectedOrder.shipping_address.phone}</p>
                        </div>
                      </div>
                    )}

                    {/* Payment Method */}
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/10">
                        {selectedOrder.shipping_address.paymentMethod === "online" ? (
                          <CreditCard className="h-4 w-4 text-amber-500" />
                        ) : (
                          <Banknote className="h-4 w-4 text-amber-500" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Payment Method</p>
                        <p className="font-medium capitalize">
                          {selectedOrder.shipping_address.paymentMethod === "online" 
                            ? "Online Payment" 
                            : "Cash on Delivery"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Proof with enhanced styling */}
              {selectedOrder.payment_proof_url && (
                <PaymentProofDisplay paymentProofPath={selectedOrder.payment_proof_url} />
              )}

              {/* Total */}
              <div className="flex justify-between items-center pt-4 border-t border-border/50">
                <span className="font-semibold text-lg">Total Amount</span>
                <span className="text-2xl font-bold text-primary">{formatPrice(selectedOrder.total)}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
