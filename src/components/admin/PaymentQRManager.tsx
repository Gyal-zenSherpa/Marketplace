import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Upload, X, Loader2, AlertTriangle } from "lucide-react";

interface PaymentQR {
  id: string;
  name: string;
  type: string;
  image_url: string | null;
  display_order: number;
  is_active: boolean;
}

// URL validation helper
const isValidUrl = (url: string | null): boolean => {
  if (!url) return false;
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
  } catch {
    return false;
  }
};

// Check if URL is a local path (invalid)
const isLocalPath = (url: string | null): boolean => {
  if (!url) return false;
  // Common patterns for local paths
  return (
    url.startsWith('.') ||
    url.startsWith('/') ||
    url.startsWith('\\') ||
    url.includes(':\\') ||
    url.match(/^[A-Za-z]:/) !== null ||
    !url.includes('://') ||
    url.startsWith('file://')
  );
};

export function PaymentQRManager() {
  const [qrCodes, setQrCodes] = useState<PaymentQR[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const defaultQRTypes = [
    { type: "bank", name: "Bank QR" },
    { type: "esewa", name: "Esewa QR" },
    { type: "other", name: "Other QR" },
  ];

  useEffect(() => {
    fetchQRCodes();
  }, []);

  const fetchQRCodes = async () => {
    const { data, error } = await supabase
      .from("payment_qr_codes")
      .select("*")
      .order("display_order");

    if (error) {
      console.error("Error fetching QR codes:", error);
      return;
    }

    // Initialize missing QR types
    const existingTypes = data?.map((q) => q.type) || [];
    const missingQRs: PaymentQR[] = [];

    for (const defaultQR of defaultQRTypes) {
      if (!existingTypes.includes(defaultQR.type)) {
        missingQRs.push({
          id: `temp-${defaultQR.type}`,
          name: defaultQR.name,
          type: defaultQR.type,
          image_url: null,
          display_order: defaultQRTypes.findIndex((d) => d.type === defaultQR.type),
          is_active: true,
        });
      }
    }

    // Insert missing QRs
    if (missingQRs.length > 0) {
      for (const qr of missingQRs) {
        await supabase.from("payment_qr_codes").insert({
          name: qr.name,
          type: qr.type,
          display_order: qr.display_order,
          is_active: true,
        });
      }
      // Re-fetch after insert
      const { data: refreshedData } = await supabase
        .from("payment_qr_codes")
        .select("*")
        .order("display_order");
      setQrCodes(refreshedData || []);
    } else {
      setQrCodes(data || []);
    }

    setLoading(false);
  };

  const handleImageUpload = async (qrId: string, file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    setUploading(qrId);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${qrId}-${Date.now()}.${fileExt}`;

      // Upload to the dedicated payment-qr-codes bucket
      const { error: uploadError } = await supabase.storage
        .from("payment-qr-codes")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("payment-qr-codes")
        .getPublicUrl(fileName);

      // Validate that we got a proper URL
      if (!isValidUrl(publicUrl)) {
        throw new Error("Failed to generate valid public URL");
      }

      // Update QR code record with validated URL
      const { error: updateError } = await supabase
        .from("payment_qr_codes")
        .update({ image_url: publicUrl })
        .eq("id", qrId);

      if (updateError) throw updateError;

      setQrCodes((prev) =>
        prev.map((qr) =>
          qr.id === qrId ? { ...qr, image_url: publicUrl } : qr
        )
      );

      toast({
        title: "QR Code uploaded",
        description: "Payment QR code has been updated successfully.",
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: "Failed to upload QR code image.",
        variant: "destructive",
      });
    } finally {
      setUploading(null);
    }
  };

  const removeImage = async (qrId: string) => {
    try {
      const { error } = await supabase
        .from("payment_qr_codes")
        .update({ image_url: null })
        .eq("id", qrId);

      if (error) throw error;

      setQrCodes((prev) =>
        prev.map((qr) => (qr.id === qrId ? { ...qr, image_url: null } : qr))
      );

      toast({
        title: "Image removed",
        description: "QR code image has been removed.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove image.",
        variant: "destructive",
      });
    }
  };

  const fixInvalidUrl = async (qrId: string) => {
    try {
      const { error } = await supabase
        .from("payment_qr_codes")
        .update({ image_url: null })
        .eq("id", qrId);

      if (error) throw error;

      setQrCodes((prev) =>
        prev.map((qr) => (qr.id === qrId ? { ...qr, image_url: null } : qr))
      );

      toast({
        title: "Invalid URL removed",
        description: "Please upload a new image.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fix invalid URL.",
        variant: "destructive",
      });
    }
  };

  const updateQRName = async (qrId: string, name: string) => {
    const { error } = await supabase
      .from("payment_qr_codes")
      .update({ name })
      .eq("id", qrId);

    if (!error) {
      setQrCodes((prev) =>
        prev.map((qr) => (qr.id === qrId ? { ...qr, name } : qr))
      );
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment QR Codes</CardTitle>
        <CardDescription>
          Upload QR code images for Bank, Esewa, and other payment methods
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {qrCodes.map((qr) => {
            const hasInvalidUrl = qr.image_url && (isLocalPath(qr.image_url) || !isValidUrl(qr.image_url));
            
            return (
              <div key={qr.id} className="space-y-3">
                <Label>{qr.type.charAt(0).toUpperCase() + qr.type.slice(1)} Payment</Label>
                <Input
                  value={qr.name}
                  onChange={(e) => updateQRName(qr.id, e.target.value)}
                  placeholder="Display name"
                  className="mb-2"
                />
                <div
                  className={`relative aspect-square rounded-lg border-2 border-dashed bg-muted/50 flex items-center justify-center overflow-hidden cursor-pointer hover:border-primary transition-colors ${
                    hasInvalidUrl ? 'border-destructive' : 'border-border'
                  }`}
                  onClick={() => !hasInvalidUrl && fileInputRefs.current[qr.id]?.click()}
                >
                  {uploading === qr.id ? (
                    <div className="flex flex-col items-center">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <span className="text-sm text-muted-foreground mt-2">Uploading...</span>
                    </div>
                  ) : hasInvalidUrl ? (
                    <div className="flex flex-col items-center text-center p-4">
                      <AlertTriangle className="h-10 w-10 text-destructive mb-2" />
                      <span className="text-sm font-medium text-destructive">Invalid File Path</span>
                      <span className="text-xs text-muted-foreground mt-1 mb-3">
                        Local file paths are not supported
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          fixInvalidUrl(qr.id);
                        }}
                      >
                        Fix & Upload New Image
                      </Button>
                    </div>
                  ) : qr.image_url && isValidUrl(qr.image_url) ? (
                    <>
                      <img
                        src={qr.image_url}
                        alt={qr.name}
                        className="w-full h-full object-contain"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeImage(qr.id);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <div className="flex flex-col items-center text-muted-foreground">
                      <Upload className="h-10 w-10 mb-2" />
                      <span className="text-sm">Click to upload</span>
                      <span className="text-xs mt-1">PNG, JPG up to 5MB</span>
                    </div>
                  )}
                </div>
                <input
                  ref={(el) => (fileInputRefs.current[qr.id] = el)}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(qr.id, file);
                  }}
                />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
