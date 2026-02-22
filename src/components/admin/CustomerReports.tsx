import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { RefreshCw, Search, Eye, AlertTriangle, CheckCircle, Clock, XCircle } from "lucide-react";
import { format } from "date-fns";

interface CustomerIssue {
  id: string;
  name: string;
  email: string;
  category: string;
  order_number: string | null;
  description: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  open: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  in_progress: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  resolved: "bg-green-500/10 text-green-600 border-green-500/20",
  closed: "bg-muted text-muted-foreground border-border",
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  open: <Clock className="h-3 w-3" />,
  in_progress: <AlertTriangle className="h-3 w-3" />,
  resolved: <CheckCircle className="h-3 w-3" />,
  closed: <XCircle className="h-3 w-3" />,
};

export function CustomerReports() {
  const [issues, setIssues] = useState<CustomerIssue[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<CustomerIssue | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [newStatus, setNewStatus] = useState("");

  const fetchIssues = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("customer_issues")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) throw error;
      setIssues((data as CustomerIssue[]) || []);
    } catch (err) {
      console.error("Error fetching issues:", err);
      toast({ variant: "destructive", title: "Error", description: "Failed to load reports." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchIssues(); }, []);

  const updateIssue = async () => {
    if (!selectedIssue) return;
    try {
      const { error } = await supabase
        .from("customer_issues")
        .update({
          status: newStatus || selectedIssue.status,
          admin_notes: adminNotes || selectedIssue.admin_notes,
        })
        .eq("id", selectedIssue.id);

      if (error) throw error;

      toast({ title: "Updated", description: "Issue has been updated." });
      setDetailOpen(false);
      fetchIssues();
    } catch (err) {
      console.error("Error updating issue:", err);
      toast({ variant: "destructive", title: "Error", description: "Failed to update issue." });
    }
  };

  const openDetail = (issue: CustomerIssue) => {
    setSelectedIssue(issue);
    setAdminNotes(issue.admin_notes || "");
    setNewStatus(issue.status);
    setDetailOpen(true);
  };

  const filtered = issues.filter((i) => {
    const s = search.toLowerCase();
    const matchesSearch =
      i.name.toLowerCase().includes(s) ||
      i.email.toLowerCase().includes(s) ||
      i.category.toLowerCase().includes(s) ||
      i.description.toLowerCase().includes(s) ||
      (i.order_number?.toLowerCase().includes(s) ?? false);
    const matchesStatus = statusFilter ? i.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  const openCount = issues.filter((i) => i.status === "open").length;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                Customer Reports
                {openCount > 0 && (
                  <Badge variant="destructive" className="text-xs">{openCount} open</Badge>
                )}
              </CardTitle>
              <CardDescription>View and manage customer-reported issues</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <Select value={statusFilter || "all"} onValueChange={(v) => setStatusFilter(v === "all" ? null : v)}>
                <SelectTrigger className="w-full sm:w-36">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search reports..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 w-full sm:w-64"
                />
              </div>
              <Button variant="outline" size="icon" onClick={fetchIssues} disabled={loading}>
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden sm:table-cell">Email</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      {loading ? "Loading reports..." : "No reports found"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((issue) => (
                    <TableRow key={issue.id}>
                      <TableCell className="font-medium">{issue.name}</TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">{issue.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{issue.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`gap-1 ${STATUS_COLORS[issue.status] || ""}`}>
                          {STATUS_ICONS[issue.status]}
                          <span className="capitalize">{issue.status.replace("_", " ")}</span>
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                        {format(new Date(issue.created_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => openDetail(issue)}>
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

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Issue Details</DialogTitle>
          </DialogHeader>
          {selectedIssue && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground">Name</Label>
                  <p className="font-medium">{selectedIssue.name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="font-medium">{selectedIssue.email}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Category</Label>
                  <p className="font-medium">{selectedIssue.category}</p>
                </div>
                {selectedIssue.order_number && (
                  <div>
                    <Label className="text-muted-foreground">Order #</Label>
                    <p className="font-medium">{selectedIssue.order_number}</p>
                  </div>
                )}
              </div>

              <div>
                <Label className="text-muted-foreground">Description</Label>
                <p className="mt-1 text-sm bg-muted p-3 rounded-lg">{selectedIssue.description}</p>
              </div>

              <div>
                <Label className="text-muted-foreground">Submitted</Label>
                <p className="text-sm">{format(new Date(selectedIssue.created_at), "MMMM d, yyyy 'at' h:mm a")}</p>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Admin Notes</Label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes about this issue..."
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailOpen(false)}>Cancel</Button>
            <Button onClick={updateIssue}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
