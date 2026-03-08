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
import { RefreshCw, Search } from "lucide-react";

type AppRole = "admin" | "moderator" | "seller" | "user";

interface UserWithRole {
  id: string;
  user_id: string;
  full_name: string | null;
  role: AppRole;
  created_at: string;
}

const ROLE_COLORS: Record<AppRole, string> = {
  admin: "bg-red-500/10 text-red-500 border-red-500/20",
  moderator: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  seller: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  user: "bg-green-500/10 text-green-500 border-green-500/20",
};

interface Props {
  currentUserId: string;
}

export function AdminUsersTab({ currentUserId }: Props) {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState("");

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const { data: profiles, error: profilesError } = await supabase.from("profiles").select("id, user_id, full_name, created_at");
      if (profilesError) throw profilesError;
      const { data: roles, error: rolesError } = await supabase.from("user_roles").select("user_id, role");
      if (rolesError) throw rolesError;

      const usersWithRoles: UserWithRole[] = (profiles || []).map((profile) => {
        const userRole = roles?.find((r) => r.user_id === profile.user_id);
        return { id: profile.id, user_id: profile.user_id, full_name: profile.full_name, created_at: profile.created_at, role: (userRole?.role as AppRole) || "user" };
      });
      setUsers(usersWithRoles);
    } catch (err) {
      console.error("Error fetching users:", err);
      toast({ variant: "destructive", title: "Error", description: "Failed to load users." });
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const updateUserRole = async (userId: string, newRole: AppRole) => {
    try {
      const { data: existingRole } = await supabase.from("user_roles").select("id").eq("user_id", userId).maybeSingle();
      if (existingRole) {
        const { error } = await supabase.from("user_roles").update({ role: newRole }).eq("user_id", userId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: newRole });
        if (error) throw error;
      }
      await supabase.functions.invoke('security-middleware', {
        body: { action: 'log-security-event', data: { action: 'role_change', userId: currentUserId, resourceType: 'user_role', resourceId: userId, metadata: { newRole } } },
      });
      toast({ title: "Role updated", description: `User role has been changed to ${newRole}.` });
      fetchUsers();
    } catch (err) {
      console.error("Error updating role:", err);
      toast({ variant: "destructive", title: "Error", description: "Failed to update user role." });
    }
  };

  const filteredUsers = users.filter((u) => {
    const search = userSearch.toLowerCase();
    return u.full_name?.toLowerCase().includes(search) || u.role.toLowerCase().includes(search) || u.user_id.toLowerCase().includes(search);
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle>User Management</CardTitle>
            <CardDescription>Manage user accounts and assign roles</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search users..." value={userSearch} onChange={(e) => setUserSearch(e.target.value)} className="pl-9 w-full md:w-64" />
            </div>
            <Button variant="outline" size="icon" onClick={fetchUsers} disabled={usersLoading}>
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
                    <TableCell className="font-medium">{u.full_name || "—"}</TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">{u.user_id.slice(0, 8)}...</TableCell>
                    <TableCell><Badge className={ROLE_COLORS[u.role]} variant="outline">{u.role}</Badge></TableCell>
                    <TableCell className="text-muted-foreground">{format(new Date(u.created_at), "MMM d, yyyy")}</TableCell>
                    <TableCell className="text-right">
                      <Select value={u.role} onValueChange={(value: AppRole) => updateUserRole(u.user_id, value)} disabled={u.user_id === currentUserId}>
                        <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
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
  );
}
