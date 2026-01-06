import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Upload, X, ImageIcon, Loader2 } from "lucide-react";

interface PaymentQR {
  id: string;
  name: string;
  type: string;
  image_url: string | null;
  display_order: number;
  is_active: boolean;
}

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
      const fileName = `payment-qr/${qrId}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("product-images")
        .getPublicUrl(fileName);

      // Update QR code record
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
          {qrCodes.map((qr) => (
            <div key={qr.id} className="space-y-3">
              <Label>{qr.type.charAt(0).toUpperCase() + qr.type.slice(1)} Payment</Label>
              <Input
                value={qr.name}
                onChange={(e) => updateQRName(qr.id, e.target.value)}
                placeholder="Display name"
                className="mb-2"
              />
              <div
                className="relative aspect-square rounded-lg border-2 border-dashed border-border bg-muted/50 flex items-center justify-center overflow-hidden cursor-pointer hover:border-primary transition-colors"
                onClick={() => fileInputRefs.current[qr.id]?.click()}
              >
                {uploading === qr.id ? (
                  <div className="flex flex-col items-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground mt-2">Uploading...</span>
                  </div>
                ) : qr.image_url ? (
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
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
