import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { RefreshCw, CheckCircle, XCircle, Clock, Eye } from "lucide-react";

interface SellerApplication {
  id: string;
  user_id: string;
  business_name: string;
  business_description: string;
  phone_number: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
  document_type: string | null;
  document_image_url: string | null;
}

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  citizenship: "Citizenship Certificate",
  passport: "Passport",
  driving_license: "Driving License",
};

interface Props {
  userId: string;
}

export function AdminApplicationsTab({ userId }: Props) {
  const [applications, setApplications] = useState<SellerApplication[]>([]);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<SellerApplication | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [reviewAction, setReviewAction] = useState<"approved" | "rejected">("approved");
  const [signedDocumentUrl, setSignedDocumentUrl] = useState<string | null>(null);

  const extractStoragePath = (url: string, bucket: string): string | null => {
    try {
      const urlObj = new URL(url);
      const pathMatch = urlObj.pathname.match(new RegExp(`/storage/v1/object/public/${bucket}/(.+)`));
      return pathMatch ? decodeURIComponent(pathMatch[1]) : null;
    } catch {
      return null;
    }
  };

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
      toast({ variant: "destructive", title: "Error", description: "Failed to load seller applications." });
    } finally {
      setApplicationsLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  useEffect(() => {
    const fetchSignedDocumentUrl = async () => {
      if (!selectedApplication?.document_image_url || !reviewDialogOpen) {
        setSignedDocumentUrl(null);
        return;
      }
      const path = extractStoragePath(selectedApplication.document_image_url, 'seller-documents');
      if (!path) { setSignedDocumentUrl(null); return; }
      const { data, error } = await supabase.storage.from('seller-documents').createSignedUrl(path, 3600);
      if (error) { console.error('Failed to get signed URL:', error); setSignedDocumentUrl(null); return; }
      setSignedDocumentUrl(data.signedUrl);
    };
    fetchSignedDocumentUrl();
  }, [selectedApplication, reviewDialogOpen]);

  const openReviewDialog = (app: SellerApplication, action: "approved" | "rejected") => {
    setSelectedApplication(app);
    setReviewAction(action);
    setAdminNotes("");
    setReviewDialogOpen(true);
  };

  const reviewApplication = async () => {
    if (!selectedApplication) return;
    try {
      const { error: appError } = await supabase
        .from("seller_applications")
        .update({
          status: reviewAction,
          admin_notes: adminNotes || null,
          reviewed_by: userId,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", selectedApplication.id);
      if (appError) throw appError;

      if (reviewAction === "approved") {
        const { error: profileError } = await supabase
          .from("profiles")
          .update({ is_seller: true })
          .eq("user_id", selectedApplication.user_id);
        if (profileError) throw profileError;
      }

      try {
        await supabase.functions.invoke('send-application-email', {
          body: {
            userId: selectedApplication.user_id,
            businessName: selectedApplication.business_name,
            status: reviewAction,
            adminNotes: adminNotes || undefined,
          },
        });
      } catch (emailErr) {
        console.error("Failed to send email notification:", emailErr);
      }

      toast({ title: `Application ${reviewAction}`, description: `The seller application has been ${reviewAction}. An email notification has been sent.` });
      setReviewDialogOpen(false);
      setSelectedApplication(null);
      setAdminNotes("");
      fetchApplications();
    } catch (err) {
      console.error("Error reviewing application:", err);
      toast({ variant: "destructive", title: "Error", description: "Failed to process the application." });
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Seller Applications</CardTitle>
              <CardDescription>Review and manage seller applications</CardDescription>
            </div>
            <Button variant="outline" size="icon" onClick={fetchApplications} disabled={applicationsLoading}>
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
                      <TableCell className="max-w-xs truncate text-muted-foreground">{app.business_description}</TableCell>
                      <TableCell>
                        {app.status === "pending" && <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" /> Pending</Badge>}
                        {app.status === "approved" && <Badge className="gap-1 bg-green-500"><CheckCircle className="h-3 w-3" /> Approved</Badge>}
                        {app.status === "rejected" && <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> Rejected</Badge>}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{format(new Date(app.created_at), "MMM d, yyyy")}</TableCell>
                      <TableCell className="text-right">
                        {app.status === "pending" ? (
                          <div className="flex gap-2 justify-end">
                            <Button size="sm" variant="outline" className="text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => openReviewDialog(app, "approved")}>
                              <CheckCircle className="h-4 w-4 mr-1" /> Approve
                            </Button>
                            <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => openReviewDialog(app, "rejected")}>
                              <XCircle className="h-4 w-4 mr-1" /> Reject
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

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{reviewAction === "approved" ? "Approve" : "Reject"} Application</DialogTitle>
            <DialogDescription>
              {reviewAction === "approved" ? "This will grant the user seller privileges." : "Please provide a reason for rejection."}
            </DialogDescription>
          </DialogHeader>
          {selectedApplication && (
            <div className="space-y-4">
              <div className="bg-muted rounded-lg p-4 space-y-2">
                <p className="font-medium">{selectedApplication.business_name}</p>
                <p className="text-sm text-muted-foreground">{selectedApplication.business_description}</p>
                {selectedApplication.phone_number && <p className="text-sm text-muted-foreground">Phone: {selectedApplication.phone_number}</p>}
              </div>
              {selectedApplication.document_type && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Government ID Verification</Label>
                  <div className="bg-muted/50 rounded-lg p-4 border">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="outline" className="text-xs">
                        {DOCUMENT_TYPE_LABELS[selectedApplication.document_type] || selectedApplication.document_type}
                      </Badge>
                    </div>
                    {selectedApplication.document_image_url ? (
                      signedDocumentUrl ? (
                        <div className="relative">
                          <img src={signedDocumentUrl} alt="Government ID Document" className="w-full max-h-64 object-contain rounded-md border bg-background" />
                          <Button variant="outline" size="sm" className="absolute top-2 right-2" onClick={() => window.open(signedDocumentUrl!, '_blank')}>
                            <Eye className="h-4 w-4 mr-1" /> View Full Size
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-32 bg-muted rounded-md">
                          <p className="text-sm text-muted-foreground">Loading document...</p>
                        </div>
                      )
                    ) : (
                      <div className="flex items-center justify-center h-32 bg-muted rounded-md">
                        <p className="text-sm text-muted-foreground">No document image uploaded</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="admin_notes">{reviewAction === "rejected" ? "Rejection Reason *" : "Notes (optional)"}</Label>
                <Textarea
                  id="admin_notes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder={reviewAction === "rejected" ? "Please explain why this application was rejected..." : "Add any notes about this decision..."}
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>Cancel</Button>
            <Button onClick={reviewApplication} variant={reviewAction === "approved" ? "default" : "destructive"} disabled={reviewAction === "rejected" && !adminNotes.trim()}>
              {reviewAction === "approved" ? "Approve" : "Reject"} Application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
