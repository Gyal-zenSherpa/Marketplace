import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { RefreshCw, Search, CheckCircle, XCircle, Clock, Shield, AlertTriangle, Activity } from "lucide-react";

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

const ACTION_ICONS: Record<string, React.ReactNode> = {
  login_success: <CheckCircle className="h-4 w-4 text-green-500" />,
  login_failed: <XCircle className="h-4 w-4 text-red-500" />,
  logout: <Clock className="h-4 w-4 text-muted-foreground" />,
  role_change: <Shield className="h-4 w-4 text-blue-500" />,
  suspicious_activity: <AlertTriangle className="h-4 w-4 text-orange-500" />,
};

export function AdminAuditTab() {
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logSearch, setLogSearch] = useState("");

  const fetchAuditLogs = async () => {
    setLogsLoading(true);
    try {
      const { data, error } = await supabase.from("security_audit_log").select("*").order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      setAuditLogs(data || []);
    } catch (err) {
      console.error("Error fetching audit logs:", err);
      toast({ variant: "destructive", title: "Error", description: "Failed to load audit logs." });
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => { fetchAuditLogs(); }, []);

  const filteredLogs = auditLogs.filter((log) => {
    const search = logSearch.toLowerCase();
    return log.action.toLowerCase().includes(search) || log.resource_type?.toLowerCase().includes(search) || log.ip_address?.toLowerCase().includes(search);
  });

  return (
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
              <Input placeholder="Search logs..." value={logSearch} onChange={(e) => setLogSearch(e.target.value)} className="pl-9 w-64" />
            </div>
            <Button variant="outline" size="icon" onClick={fetchAuditLogs} disabled={logsLoading}>
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
                    <TableCell>{ACTION_ICONS[log.action] || <Activity className="h-4 w-4 text-muted-foreground" />}</TableCell>
                    <TableCell className="font-medium"><span className="capitalize">{log.action.replace(/_/g, " ")}</span></TableCell>
                    <TableCell className="text-muted-foreground">
                      {log.resource_type ? <span>{log.resource_type}{log.resource_id && <span className="text-xs ml-1">({log.resource_id.slice(0, 8)}...)</span>}</span> : "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground font-mono text-sm">{log.ip_address || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{format(new Date(log.created_at), "MMM d, yyyy HH:mm:ss")}</TableCell>
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
