import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Store, Clock, CheckCircle, XCircle, ArrowLeft, Upload, FileText, Loader2 } from "lucide-react";

interface SellerApplication {
  id: string;
  business_name: string;
  business_description: string;
  phone_number: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
  document_type: string | null;
  document_image_url: string | null;
}

const DOCUMENT_TYPES = [
  { value: "citizenship", label: "Citizenship Certificate" },
  { value: "passport", label: "Passport" },
  { value: "driving_license", label: "Driving License" },
];

const SellerApplication = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [existingApplication, setExistingApplication] = useState<SellerApplication | null>(null);
  const [isSeller, setIsSeller] = useState(false);
  const [documentType, setDocumentType] = useState<string>("");
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentPreview, setDocumentPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    business_name: "",
    business_description: "",
    phone_number: "",
  });

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    checkSellerStatus();
  }, [user, navigate]);

  const checkSellerStatus = async () => {
    if (!user) return;
    
    try {
      // Check if user is already a seller
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_seller")
        .eq("user_id", user.id)
        .single();

      if (profile?.is_seller) {
        setIsSeller(true);
        setLoading(false);
        return;
      }

      // Check for existing application
      const { data: application } = await supabase
        .from("seller_applications")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (application) {
        setExistingApplication(application);
      }
    } catch (error) {
      console.error("Error checking seller status:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (JPG, PNG, etc.)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    setDocumentFile(file);
    setDocumentPreview(URL.createObjectURL(file));
  };

  const uploadDocument = async (): Promise<string | null> => {
    if (!documentFile || !user) return null;

    setUploading(true);
    try {
      const fileExt = documentFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('seller-documents')
        .upload(fileName, documentFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('seller-documents')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload document",
        variant: "destructive",
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validate document type and file
    if (!documentType) {
      toast({
        title: "Document type required",
        description: "Please select a government ID type",
        variant: "destructive",
      });
      return;
    }

    if (!documentFile) {
      toast({
        title: "Document image required",
        description: "Please upload an image of your government ID",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      // Upload document first
      const documentUrl = await uploadDocument();
      if (!documentUrl) {
        setSubmitting(false);
        return;
      }

      const { error } = await supabase.from("seller_applications").insert({
        user_id: user.id,
        business_name: formData.business_name,
        business_description: formData.business_description,
        phone_number: formData.phone_number || null,
        document_type: documentType,
        document_image_url: documentUrl,
      });

      if (error) throw error;

      toast({
        title: "Application submitted!",
        description: "We'll review your application and get back to you soon.",
      });

      checkSellerStatus();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit application",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" /> Pending Review</Badge>;
      case "approved":
        return <Badge className="gap-1 bg-green-500"><CheckCircle className="h-3 w-3" /> Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> Rejected</Badge>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isSeller) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle>You're Already a Seller!</CardTitle>
              <CardDescription>
                You have full access to the seller dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button onClick={() => navigate("/seller")}>
                Go to Seller Dashboard
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Marketplace
        </Button>

        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Store className="h-8 w-8 text-primary" />
            </div>
            <CardTitle>Become a Seller</CardTitle>
            <CardDescription>
              Apply to sell your products on our marketplace
            </CardDescription>
          </CardHeader>
          <CardContent>
            {existingApplication ? (
              <div className="space-y-6">
                <div className="text-center">
                  {getStatusBadge(existingApplication.status)}
                </div>
                
                <div className="bg-muted rounded-lg p-4 space-y-3">
                  <div>
                    <Label className="text-muted-foreground">Business Name</Label>
                    <p className="font-medium">{existingApplication.business_name}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Description</Label>
                    <p>{existingApplication.business_description}</p>
                  </div>
                  {existingApplication.phone_number && (
                    <div>
                      <Label className="text-muted-foreground">Phone</Label>
                      <p>{existingApplication.phone_number}</p>
                    </div>
                  )}
                  <div>
                    <Label className="text-muted-foreground">Submitted</Label>
                    <p>{new Date(existingApplication.created_at).toLocaleDateString()}</p>
                  </div>
                </div>

                {existingApplication.status === "pending" && (
                  <p className="text-center text-muted-foreground">
                    Your application is being reviewed. We'll notify you once a decision is made.
                  </p>
                )}

                {existingApplication.status === "rejected" && existingApplication.admin_notes && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                    <Label className="text-destructive">Reason for rejection:</Label>
                    <p className="mt-1">{existingApplication.admin_notes}</p>
                  </div>
                )}

                {existingApplication.status === "approved" && (
                  <div className="text-center">
                    <Button onClick={() => navigate("/seller")}>
                      Go to Seller Dashboard
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="business_name">Business Name *</Label>
                  <Input
                    id="business_name"
                    value={formData.business_name}
                    onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                    placeholder="Your business or store name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="business_description">Business Description *</Label>
                  <Textarea
                    id="business_description"
                    value={formData.business_description}
                    onChange={(e) => setFormData({ ...formData, business_description: e.target.value })}
                    placeholder="Tell us about your business and what products you plan to sell"
                    rows={4}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone_number">Phone Number (optional)</Label>
                  <Input
                    id="phone_number"
                    type="tel"
                    value={formData.phone_number}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                    placeholder="+1 (555) 000-0000"
                  />
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <div className="space-y-2">
                    <Label htmlFor="document_type">Government ID Type *</Label>
                    <Select value={documentType} onValueChange={setDocumentType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select document type" />
                      </SelectTrigger>
                      <SelectContent>
                        {DOCUMENT_TYPES.map((doc) => (
                          <SelectItem key={doc.value} value={doc.value}>
                            {doc.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Please provide a government-issued ID for verification
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="document_image">Upload Document Image *</Label>
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 hover:border-primary/50 transition-colors">
                      {documentPreview ? (
                        <div className="space-y-3">
                          <img
                            src={documentPreview}
                            alt="Document preview"
                            className="w-full max-h-48 object-contain rounded-md"
                          />
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              {documentFile?.name}
                            </span>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setDocumentFile(null);
                                setDocumentPreview(null);
                              }}
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <label htmlFor="document_image" className="flex flex-col items-center justify-center cursor-pointer py-4">
                          <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                          <span className="text-sm font-medium">Click to upload document</span>
                          <span className="text-xs text-muted-foreground mt-1">
                            JPG, PNG up to 5MB
                          </span>
                        </label>
                      )}
                      <Input
                        id="document_image"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </div>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={submitting || uploading}>
                  {submitting || uploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {uploading ? "Uploading document..." : "Submitting..."}
                    </>
                  ) : (
                    "Submit Application"
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default SellerApplication;
