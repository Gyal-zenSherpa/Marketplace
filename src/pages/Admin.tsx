import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
} from "lucide-react";
import { format } from "date-fns";

type AppRole = "admin" | "moderator" | "seller" | "user";

interface UserWithRole {
  id: string;
  user_id: string;
  email: string | null;
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
      // Get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, user_id, email, full_name, created_at");

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
          ...profile,
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
    }
  }, [isAdmin]);

  // Filter users based on search
  const filteredUsers = users.filter((u) => {
    const search = userSearch.toLowerCase();
    return (
      u.email?.toLowerCase().includes(search) ||
      u.full_name?.toLowerCase().includes(search) ||
      u.role.toLowerCase().includes(search)
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              User Management
            </TabsTrigger>
            <TabsTrigger value="audit" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Audit Logs
            </TabsTrigger>
          </TabsList>

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
                        <TableHead>Email</TableHead>
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
                            <TableCell>{u.email || "—"}</TableCell>
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
        </Tabs>
      </div>
    </div>
  );
}
