import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Shield,
  Users,
  Activity,
  ArrowLeft,
  Search,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Key,
  Store,
  Package,
  Truck,
  Eye,
  CreditCard,
} from "lucide-react";
import { format } from "date-fns";
import { TwoFactorSetup } from "@/components/TwoFactorSetup";
import { PaymentQRManager } from "@/components/admin/PaymentQRManager";

type AppRole = "admin" | "moderator" | "seller" | "user";

interface UserWithRole {
  id: string;
  user_id: string;
  full_name: string | null;
  role: AppRole;
  created_at: string;
}

interface AuditLogEntry {
  id: string;
  action: string;
  user_id: string | null;
  resource_type: string | null;
  resource_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  metadata: unknown;
  created_at: string;
}

interface SellerApplication {
  id: string;
  user_id: string;
  business_name: string;
  business_description: string;
  phone_number: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
}

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
  } | null;
  payment_proof_url: string | null;
  order_items: OrderItem[];
}

const ORDER_STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"];

const ROLE_COLORS: Record<AppRole, string> = {
  admin: "bg-red-500/10 text-red-500 border-red-500/20",
  moderator: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  seller: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  user: "bg-green-500/10 text-green-500 border-green-500/20",
};

const ACTION_ICONS: Record<string, React.ReactNode> = {
  login_success: <CheckCircle className="h-4 w-4 text-green-500" />,
  login_failed: <XCircle className="h-4 w-4 text-red-500" />,
  logout: <Clock className="h-4 w-4 text-muted-foreground" />,
  role_change: <Shield className="h-4 w-4 text-blue-500" />,
  suspicious_activity: <AlertTriangle className="h-4 w-4 text-orange-500" />,
};

export default function Admin() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  
  // Users state
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  
  // Audit logs state
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logSearch, setLogSearch] = useState("");

  // Seller applications state
  const [applications, setApplications] = useState<SellerApplication[]>([]);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<SellerApplication | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [reviewAction, setReviewAction] = useState<"approved" | "rejected">("approved");

  // Orders state
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orderSearch, setOrderSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [orderDetailOpen, setOrderDetailOpen] = useState(false);

  // Check if current user is admin
  useEffect(() => {
    const checkAdminAccess = async () => {
      if (loading) return;
      
      if (!user) {
        navigate("/auth");
        return;
      }

      try {
        const { data, error } = await supabase.rpc('has_role', {
          _user_id: user.id,
          _role: 'admin'
        });

        if (error) {
          console.error("Error checking admin role:", error);
          toast({
            variant: "destructive",
            title: "Access denied",
            description: "You don't have permission to access this page.",
          });
          navigate("/");
          return;
        }

        if (!data) {
          toast({
            variant: "destructive",
            title: "Access denied",
            description: "You must be an admin to access this page.",
          });
          navigate("/");
          return;
        }

        setIsAdmin(true);
      } catch (err) {
        console.error("Admin check failed:", err);
        navigate("/");
      } finally {
        setCheckingAccess(false);
      }
    };

    checkAdminAccess();
  }, [user, loading, navigate]);

  // Fetch users with roles
  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      // Get all profiles (email is now in auth.users, not profiles)
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, user_id, full_name, created_at");

      if (profilesError) throw profilesError;

      // Get all user roles
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      // Combine profiles with roles
      const usersWithRoles: UserWithRole[] = (profiles || []).map((profile) => {
        const userRole = roles?.find((r) => r.user_id === profile.user_id);
        return {
          id: profile.id,
          user_id: profile.user_id,
          full_name: profile.full_name,
          created_at: profile.created_at,
          role: (userRole?.role as AppRole) || "user",
        };
      });

      setUsers(usersWithRoles);
    } catch (err) {
      console.error("Error fetching users:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load users.",
      });
    } finally {
      setUsersLoading(false);
    }
  };

  // Fetch audit logs
  const fetchAuditLogs = async () => {
    setLogsLoading(true);
    try {
      const { data, error } = await supabase
        .from("security_audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      setAuditLogs(data || []);
    } catch (err) {
      console.error("Error fetching audit logs:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load audit logs.",
      });
    } finally {
      setLogsLoading(false);
    }
  };

  // Fetch seller applications
  const fetchApplications = async () => {
    setApplicationsLoading(true);
    try {
      const { data, error } = await supabase
        .from("seller_applications")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (err) {
      console.error("Error fetching applications:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load seller applications.",
      });
    } finally {
      setApplicationsLoading(false);
    }
  };

  // Fetch orders
  const fetchOrders = async () => {
    setOrdersLoading(true);
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          id,
          user_id,
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
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      setOrders((data as AdminOrder[]) || []);
    } catch (err) {
      console.error("Error fetching orders:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load orders.",
      });
    } finally {
      setOrdersLoading(false);
    }
  };

  // Update order status
  const updateOrderStatus = async (orderId: string, newStatus: string, userEmail?: string) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", orderId);

      if (error) throw error;

      // Find the order to get details
      const order = orders.find(o => o.id === orderId);
      
      if (order && order.shipping_address) {
        // Get user profile to find their email
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("user_id", order.user_id)
          .single();
        
        // Use provided email or try to get from shipping address
        const emailToUse = userEmail || (order.shipping_address as any)?.email;
        
        if (emailToUse) {
          // Send order status email for payment approval (processing) or cancellation
          if (["processing", "cancelled"].includes(newStatus)) {
            try {
              await supabase.functions.invoke('send-order-status-email', {
                body: {
                  orderId: order.id,
                  userEmail: emailToUse,
                  userName: profile?.full_name || order.shipping_address.fullName || 'Valued Customer',
                  status: newStatus === "processing" ? "approved" : "cancelled",
                  orderTotal: order.total,
                  orderItems: order.order_items?.map(item => ({
                    name: item.product_name,
                    quantity: item.quantity,
                    price: item.product_price,
                  })),
                  cancellationReason: newStatus === "cancelled" ? "Order was cancelled by admin" : undefined,
                },
              });
              console.log(`Order ${newStatus} email sent for order:`, orderId);
            } catch (emailErr) {
              console.error("Failed to send order status email:", emailErr);
            }
          }
          
          // Send shipping update email for shipping status changes
          if (["shipped", "delivered"].includes(newStatus)) {
            try {
              await supabase.functions.invoke('send-shipping-update', {
                body: {
                  orderId: order.id,
                  userEmail: emailToUse,
                  userName: profile?.full_name || order.shipping_address.fullName || 'Valued Customer',
                  status: newStatus as "shipped" | "delivered",
                  trackingNumber: undefined,
                  estimatedDelivery: newStatus === "shipped" ? "3-5 business days" : undefined,
                  shippingAddress: {
                    fullName: order.shipping_address.fullName || '',
                    address: order.shipping_address.address || '',
                    city: order.shipping_address.city || '',
                  },
                },
              });
              console.log('Shipping update email sent for order:', orderId);
            } catch (emailErr) {
              console.error("Failed to send shipping update email:", emailErr);
            }
          }
        }
      }

      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );

      toast({
        title: "Order updated",
        description: `Order status changed to ${newStatus}.`,
      });
    } catch (err) {
      console.error("Error updating order:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update order status.",
      });
    }
  };

  // Review seller application
  const reviewApplication = async () => {
    if (!selectedApplication) return;

    try {
      // Update application status
      const { error: appError } = await supabase
        .from("seller_applications")
        .update({
          status: reviewAction,
          admin_notes: adminNotes || null,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", selectedApplication.id);

      if (appError) throw appError;

      // If approved, update the user's profile to be a seller
      if (reviewAction === "approved") {
        const { error: profileError } = await supabase
          .from("profiles")
          .update({ is_seller: true })
          .eq("user_id", selectedApplication.user_id);

        if (profileError) throw profileError;
      }

      // Send email notification
      try {
        await supabase.functions.invoke('send-application-email', {
          body: {
            userId: selectedApplication.user_id,
            businessName: selectedApplication.business_name,
            status: reviewAction,
            adminNotes: adminNotes || undefined,
          },
        });
        console.log("Email notification sent successfully");
      } catch (emailErr) {
        console.error("Failed to send email notification:", emailErr);
        // Don't fail the whole operation if email fails
      }

      toast({
        title: `Application ${reviewAction}`,
        description: `The seller application has been ${reviewAction}. An email notification has been sent.`,
      });

      setReviewDialogOpen(false);
      setSelectedApplication(null);
      setAdminNotes("");
      fetchApplications();
    } catch (err) {
      console.error("Error reviewing application:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to process the application.",
      });
    }
  };
  const openReviewDialog = (app: SellerApplication, action: "approved" | "rejected") => {
    setSelectedApplication(app);
    setReviewAction(action);
    setAdminNotes("");
    setReviewDialogOpen(true);
  };

  // Update user role
  const updateUserRole = async (userId: string, newRole: AppRole) => {
    try {
      // Check if user already has a role entry
      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (existingRole) {
        // Update existing role
        const { error } = await supabase
          .from("user_roles")
          .update({ role: newRole })
          .eq("user_id", userId);

        if (error) throw error;
      } else {
        // Insert new role
        const { error } = await supabase
          .from("user_roles")
          .insert({ user_id: userId, role: newRole });

        if (error) throw error;
      }

      // Log the role change
      await supabase.functions.invoke('security-middleware', {
        body: {
          action: 'log-security-event',
          data: {
            action: 'role_change',
            userId: user?.id,
            resourceType: 'user_role',
            resourceId: userId,
            metadata: { newRole },
          },
        },
      });

      toast({
        title: "Role updated",
        description: `User role has been changed to ${newRole}.`,
      });

      // Refresh users
      fetchUsers();
    } catch (err) {
      console.error("Error updating role:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update user role.",
      });
    }
  };

  // Load data when admin access is confirmed
  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
      fetchAuditLogs();
      fetchApplications();
      fetchOrders();
    }
  }, [isAdmin]);

  // Filter applications
  const pendingApplications = applications.filter((a) => a.status === "pending");

  // Filter users based on search
  const filteredUsers = users.filter((u) => {
    const search = userSearch.toLowerCase();
    return (
      u.full_name?.toLowerCase().includes(search) ||
      u.role.toLowerCase().includes(search) ||
      u.user_id.toLowerCase().includes(search)
    );
  });

  // Filter logs based on search
  const filteredLogs = auditLogs.filter((log) => {
    const search = logSearch.toLowerCase();
    return (
      log.action.toLowerCase().includes(search) ||
      log.resource_type?.toLowerCase().includes(search) ||
      log.ip_address?.toLowerCase().includes(search)
    );
  });

  // Filter orders based on search
  const filteredOrders = orders.filter((order) => {
    const search = orderSearch.toLowerCase();
    return (
      order.id.toLowerCase().includes(search) ||
      order.status.toLowerCase().includes(search) ||
      order.shipping_address?.fullName?.toLowerCase().includes(search)
    );
  });

  const formatPrice = (price: number) => `Rs. ${price.toFixed(2)}`;

  if (loading || checkingAccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-7xl mx-auto py-8 px-4">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Marketplace
        </button>

        <div className="flex items-center gap-4 mb-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl gradient-hero">
            <Shield className="h-7 w-7 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage users, roles, and monitor security</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
              <p className="text-xs text-muted-foreground">
                {users.filter((u) => u.role === "admin").length} admins, {users.filter((u) => u.role === "seller").length} sellers
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Applications</CardTitle>
              <Store className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingApplications.length}</div>
              <p className="text-xs text-muted-foreground">
                Seller requests awaiting review
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Security Events</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{auditLogs.length}</div>
              <p className="text-xs text-muted-foreground">
                Last 100 events shown
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed Logins</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {auditLogs.filter((l) => l.action === "login_failed").length}
              </div>
              <p className="text-xs text-muted-foreground">
                In recent events
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="applications" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 max-w-4xl">
            <TabsTrigger value="applications" className="flex items-center gap-2">
              <Store className="h-4 w-4" />
              Applications
              {pendingApplications.length > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {pendingApplications.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Orders
              <Badge variant="secondary" className="ml-1 text-xs">
                {orders.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Payments
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="audit" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Audit Logs
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              Security
            </TabsTrigger>
          </TabsList>

          {/* Seller Applications Tab */}
          <TabsContent value="applications">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Seller Applications</CardTitle>
                    <CardDescription>Review and manage seller applications</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={fetchApplications}
                    disabled={applicationsLoading}
                  >
                    <RefreshCw className={`h-4 w-4 ${applicationsLoading ? "animate-spin" : ""}`} />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Business Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Applied</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {applications.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            {applicationsLoading ? "Loading applications..." : "No seller applications found"}
                          </TableCell>
                        </TableRow>
                      ) : (
                        applications.map((app) => (
                          <TableRow key={app.id}>
                            <TableCell className="font-medium">{app.business_name}</TableCell>
                            <TableCell className="max-w-xs truncate text-muted-foreground">
                              {app.business_description}
                            </TableCell>
                            <TableCell>
                              {app.status === "pending" && (
                                <Badge variant="secondary" className="gap-1">
                                  <Clock className="h-3 w-3" /> Pending
                                </Badge>
                              )}
                              {app.status === "approved" && (
                                <Badge className="gap-1 bg-green-500">
                                  <CheckCircle className="h-3 w-3" /> Approved
                                </Badge>
                              )}
                              {app.status === "rejected" && (
                                <Badge variant="destructive" className="gap-1">
                                  <XCircle className="h-3 w-3" /> Rejected
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {format(new Date(app.created_at), "MMM d, yyyy")}
                            </TableCell>
                            <TableCell className="text-right">
                              {app.status === "pending" ? (
                                <div className="flex gap-2 justify-end">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                    onClick={() => openReviewDialog(app, "approved")}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => openReviewDialog(app, "rejected")}
                                  >
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Reject
                                  </Button>
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-sm">Reviewed</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Management Tab */}
          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Order Management</CardTitle>
                    <CardDescription>View and manage customer orders</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search orders..."
                        value={orderSearch}
                        onChange={(e) => setOrderSearch(e.target.value)}
                        className="pl-9 w-64"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={fetchOrders}
                      disabled={ordersLoading}
                    >
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
                        <TableHead>Payment</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
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
                            <TableCell className="font-mono text-xs">
                              #{order.id.slice(0, 8).toUpperCase()}
                            </TableCell>
                            <TableCell className="font-medium">
                              {order.shipping_address?.fullName || "—"}
                            </TableCell>
                            <TableCell>{formatPrice(order.total)}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {order.shipping_address?.paymentMethod === "online" ? "Online" : "COD"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Select
                                value={order.status}
                                onValueChange={(value) => updateOrderStatus(order.id, value)}
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {ORDER_STATUSES.map((status) => (
                                    <SelectItem key={status} value={status}>
                                      <span className="capitalize">{status}</span>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {format(new Date(order.created_at), "MMM d, yyyy")}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedOrder(order);
                                  setOrderDetailOpen(true);
                                }}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
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
          </TabsContent>

          {/* Payment QR Codes Tab */}
          <TabsContent value="payments">
            <PaymentQRManager />
          </TabsContent>

          {/* User Management Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>User Management</CardTitle>
                    <CardDescription>Manage user accounts and assign roles</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search users..."
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        className="pl-9 w-64"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={fetchUsers}
                      disabled={usersLoading}
                    >
                      <RefreshCw className={`h-4 w-4 ${usersLoading ? "animate-spin" : ""}`} />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>User ID</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            {usersLoading ? "Loading users..." : "No users found"}
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredUsers.map((u) => (
                          <TableRow key={u.id}>
                            <TableCell className="font-medium">
                              {u.full_name || "—"}
                            </TableCell>
                            <TableCell className="text-xs font-mono text-muted-foreground">
                              {u.user_id.slice(0, 8)}...
                            </TableCell>
                            <TableCell>
                              <Badge className={ROLE_COLORS[u.role]} variant="outline">
                                {u.role}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {format(new Date(u.created_at), "MMM d, yyyy")}
                            </TableCell>
                            <TableCell className="text-right">
                              <Select
                                value={u.role}
                                onValueChange={(value: AppRole) => updateUserRole(u.user_id, value)}
                                disabled={u.user_id === user?.id}
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="user">User</SelectItem>
                                  <SelectItem value="seller">Seller</SelectItem>
                                  <SelectItem value="moderator">Moderator</SelectItem>
                                  <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Audit Logs Tab */}
          <TabsContent value="audit">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Security Audit Log</CardTitle>
                    <CardDescription>Monitor security events and user activity</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search logs..."
                        value={logSearch}
                        onChange={(e) => setLogSearch(e.target.value)}
                        className="pl-9 w-64"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={fetchAuditLogs}
                      disabled={logsLoading}
                    >
                      <RefreshCw className={`h-4 w-4 ${logsLoading ? "animate-spin" : ""}`} />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]" />
                        <TableHead>Action</TableHead>
                        <TableHead>Resource</TableHead>
                        <TableHead>IP Address</TableHead>
                        <TableHead>Timestamp</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLogs.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            {logsLoading ? "Loading audit logs..." : "No audit logs found"}
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredLogs.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell>
                              {ACTION_ICONS[log.action] || <Activity className="h-4 w-4 text-muted-foreground" />}
                            </TableCell>
                            <TableCell className="font-medium">
                              <span className="capitalize">{log.action.replace(/_/g, " ")}</span>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {log.resource_type ? (
                                <span>
                                  {log.resource_type}
                                  {log.resource_id && (
                                    <span className="text-xs ml-1">({log.resource_id.slice(0, 8)}...)</span>
                                  )}
                                </span>
                              ) : (
                                "—"
                              )}
                            </TableCell>
                            <TableCell className="text-muted-foreground font-mono text-sm">
                              {log.ip_address || "—"}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {format(new Date(log.created_at), "MMM d, yyyy HH:mm:ss")}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <div className="space-y-6">
              <TwoFactorSetup userId={user?.id || ""} />
              
              <Card>
                <CardHeader>
                  <CardTitle>Security Recommendations</CardTitle>
                  <CardDescription>Best practices for admin account security</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      <span>Use a strong, unique password for your admin account</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      <span>Enable two-factor authentication (2FA) for additional security</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      <span>Regularly review the audit logs for suspicious activity</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      <span>Store backup codes securely in a password manager</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 shrink-0" />
                      <span>Never share your admin credentials or 2FA codes with anyone</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Review Application Dialog */}
        <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {reviewAction === "approved" ? "Approve" : "Reject"} Application
              </DialogTitle>
              <DialogDescription>
                {reviewAction === "approved"
                  ? "This will grant the user seller privileges."
                  : "Please provide a reason for rejection."}
              </DialogDescription>
            </DialogHeader>
            {selectedApplication && (
              <div className="space-y-4">
                <div className="bg-muted rounded-lg p-4 space-y-2">
                  <p className="font-medium">{selectedApplication.business_name}</p>
                  <p className="text-sm text-muted-foreground">{selectedApplication.business_description}</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin_notes">
                    {reviewAction === "rejected" ? "Rejection Reason *" : "Notes (optional)"}
                  </Label>
                  <Textarea
                    id="admin_notes"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder={
                      reviewAction === "rejected"
                        ? "Please explain why this application was rejected..."
                        : "Add any notes about this decision..."
                    }
                    rows={3}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={reviewApplication}
                variant={reviewAction === "approved" ? "default" : "destructive"}
                disabled={reviewAction === "rejected" && !adminNotes.trim()}
              >
                {reviewAction === "approved" ? "Approve" : "Reject"} Application
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Order Detail Dialog */}
        <Dialog open={orderDetailOpen} onOpenChange={setOrderDetailOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Order Details</DialogTitle>
              <DialogDescription>
                Order #{selectedOrder?.id.slice(0, 8).toUpperCase()}
              </DialogDescription>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-6">
                {/* Customer Info */}
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

                {/* Order Items */}
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

                {/* Payment Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Payment Method</h4>
                    <Badge variant="outline">
                      {selectedOrder.shipping_address?.paymentMethod === "online" ? "Online Payment" : "Cash on Delivery"}
                    </Badge>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Status</h4>
                    <Select
                      value={selectedOrder.status}
                      onValueChange={(value) => {
                        updateOrderStatus(selectedOrder.id, value);
                        setSelectedOrder({ ...selectedOrder, status: value });
                      }}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ORDER_STATUSES.map((status) => (
                          <SelectItem key={status} value={status}>
                            <span className="capitalize">{status}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Payment Proof */}
                {selectedOrder.payment_proof_url && (
                  <div>
                    <h4 className="font-semibold mb-2">Payment Proof</h4>
                    <a href={selectedOrder.payment_proof_url} target="_blank" rel="noopener noreferrer">
                      <img
                        src={selectedOrder.payment_proof_url}
                        alt="Payment proof"
                        className="w-full max-w-xs rounded-lg border hover:opacity-90 transition-opacity cursor-pointer"
                      />
                    </a>
                  </div>
                )}

                {/* Total */}
                <div className="flex justify-between items-center pt-4 border-t">
                  <span className="font-semibold text-lg">Total</span>
                  <span className="text-2xl font-bold">{formatPrice(selectedOrder.total)}</span>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
