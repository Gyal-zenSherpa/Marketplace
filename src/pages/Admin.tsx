import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Shield, Users, Activity, ArrowLeft, AlertTriangle, CheckCircle,
  Key, Store, Package, CreditCard, BarChart3, Megaphone, MessageSquare,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TwoFactorSetup } from "@/components/TwoFactorSetup";
import { PaymentQRManager } from "@/components/admin/PaymentQRManager";
import { OrderAnalytics } from "@/components/admin/OrderAnalytics";
import { AdManager } from "@/components/admin/AdManager";
import { AdSenseManager } from "@/components/admin/AdSenseManager";
import { CustomerReports } from "@/components/admin/CustomerReports";

import { AdminApplicationsTab } from "@/components/admin/AdminApplicationsTab";
import { AdminOrdersTab } from "@/components/admin/AdminOrdersTab";
import { AdminUsersTab } from "@/components/admin/AdminUsersTab";
import { AdminAuditTab } from "@/components/admin/AdminAuditTab";

export default function Admin() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "analytics");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  // Stats for cards
  const [statsData, setStatsData] = useState({ totalUsers: 0, admins: 0, sellers: 0, pendingApps: 0, auditCount: 0, failedLogins: 0, ordersCount: 0 });

  useEffect(() => {
    const checkAdminAccess = async () => {
      if (loading) return;
      if (!user) { navigate("/auth"); return; }
      try {
        const { data, error } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' });
        if (error || !data) {
          toast({ variant: "destructive", title: "Access denied", description: "You must be an admin to access this page." });
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

  // Fetch lightweight stats
  useEffect(() => {
    if (!isAdmin) return;
    const fetchStats = async () => {
      const [profilesRes, rolesRes, appsRes, logsRes, ordersRes] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("user_roles").select("role"),
        supabase.from("seller_applications").select("status"),
        supabase.from("security_audit_log").select("action").order("created_at", { ascending: false }).limit(100),
        supabase.from("orders").select("id", { count: "exact", head: true }),
      ]);
      const roles = rolesRes.data || [];
      const apps = appsRes.data || [];
      const logs = logsRes.data || [];
      setStatsData({
        totalUsers: profilesRes.count || 0,
        admins: roles.filter(r => r.role === "admin").length,
        sellers: roles.filter(r => r.role === "seller").length,
        pendingApps: apps.filter(a => a.status === "pending").length,
        auditCount: logs.length,
        failedLogins: logs.filter(l => l.action === "login_failed").length,
        ordersCount: ordersRes.count || 0,
      });
    };
    fetchStats();
  }, [isAdmin]);

  if (loading || checkingAccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-7xl mx-auto py-8 px-4">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ArrowLeft className="h-4 w-4" /> Back to Marketplace
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
              <div className="text-2xl font-bold">{statsData.totalUsers}</div>
              <p className="text-xs text-muted-foreground">{statsData.admins} admins, {statsData.sellers} sellers</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Applications</CardTitle>
              <Store className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statsData.pendingApps}</div>
              <p className="text-xs text-muted-foreground">Seller requests awaiting review</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Security Events</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statsData.auditCount}</div>
              <p className="text-xs text-muted-foreground">Last 100 events shown</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed Logins</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statsData.failedLogins}</div>
              <p className="text-xs text-muted-foreground">In recent events</p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="flex flex-wrap w-full gap-1 h-auto max-w-5xl overflow-x-auto">
            <TabsTrigger value="analytics" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <BarChart3 className="h-4 w-4" /> Analytics
            </TabsTrigger>
            <TabsTrigger value="applications" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <Store className="h-4 w-4" /> Applications
              {statsData.pendingApps > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">{statsData.pendingApps}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <Package className="h-4 w-4" /> Orders
              <Badge variant="secondary" className="ml-1 text-xs">{statsData.ordersCount}</Badge>
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <CreditCard className="h-4 w-4" /> Payments
            </TabsTrigger>
            <TabsTrigger value="ads" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <Megaphone className="h-4 w-4" /> Ads
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <Users className="h-4 w-4" /> Users
            </TabsTrigger>
            <TabsTrigger value="audit" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <Activity className="h-4 w-4" /> Audit
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <Key className="h-4 w-4" /> Security
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <MessageSquare className="h-4 w-4" /> Reports
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analytics">
            <OrderAnalytics orders={[]} onStatusFilter={(status) => { setStatusFilter(status); setActiveTab("orders"); }} />
          </TabsContent>

          <TabsContent value="applications">
            <AdminApplicationsTab userId={user?.id || ""} />
          </TabsContent>

          <TabsContent value="orders">
            <AdminOrdersTab statusFilter={statusFilter} onClearFilter={() => setStatusFilter(null)} />
          </TabsContent>

          <TabsContent value="payments">
            <PaymentQRManager />
          </TabsContent>

          <TabsContent value="ads">
            <Card>
              <CardContent className="pt-6"><AdManager /></CardContent>
            </Card>
            <Card className="mt-6">
              <CardContent className="pt-6"><AdSenseManager /></CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <AdminUsersTab currentUserId={user?.id || ""} />
          </TabsContent>

          <TabsContent value="audit">
            <AdminAuditTab />
          </TabsContent>

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
                    <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" /><span>Use a strong, unique password for your admin account</span></li>
                    <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" /><span>Enable two-factor authentication (2FA) for additional security</span></li>
                    <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" /><span>Regularly review the audit logs for suspicious activity</span></li>
                    <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" /><span>Store backup codes securely in a password manager</span></li>
                    <li className="flex items-start gap-2"><AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 shrink-0" /><span>Never share your admin credentials or 2FA codes with anyone</span></li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="reports">
            <CustomerReports />
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
}
