import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Shield, ShieldCheck, ShieldOff, Copy, Eye, EyeOff, Loader2 } from "lucide-react";
import { z } from "zod";

const tokenSchema = z.string().length(6).regex(/^\d+$/, "Must be 6 digits");

interface TwoFactorSetupProps {
  userId: string;
}

export function TwoFactorSetup({ userId }: TwoFactorSetupProps) {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [setupMode, setSetupMode] = useState(false);
  const [disableMode, setDisableMode] = useState(false);
  const [secret, setSecret] = useState("");
  const [otpauth, setOtpauth] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Check 2FA status on mount
  useEffect(() => {
    checkStatus();
  }, [userId]);

  const checkStatus = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-2fa", {
        body: { action: "status" },
      });

      if (error) throw error;
      setIsEnabled(data.enabled);
    } catch (err) {
      console.error("Error checking 2FA status:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const startSetup = async () => {
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-2fa", {
        body: { action: "setup" },
      });

      if (error) throw error;

      setSecret(data.secret);
      setOtpauth(data.otpauth);
      setBackupCodes(data.backupCodes);
      setSetupMode(true);
    } catch (err) {
      console.error("Error starting 2FA setup:", err);
      toast({
        variant: "destructive",
        title: "Setup failed",
        description: "Could not initialize 2FA setup. Please try again.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const verifyAndEnable = async () => {
    const validation = tokenSchema.safeParse(verificationCode);
    if (!validation.success) {
      toast({
        variant: "destructive",
        title: "Invalid code",
        description: "Please enter a valid 6-digit code",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-2fa", {
        body: { action: "verify", token: verificationCode },
      });

      if (error) throw error;

      if (data.success) {
        setIsEnabled(true);
        setSetupMode(false);
        toast({
          title: "2FA Enabled",
          description: "Two-factor authentication has been enabled for your account.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Verification failed",
          description: data.error || "Invalid code. Please try again.",
        });
      }
    } catch (err) {
      console.error("Error verifying 2FA:", err);
      toast({
        variant: "destructive",
        title: "Verification failed",
        description: "Could not verify the code. Please try again.",
      });
    } finally {
      setIsProcessing(false);
      setVerificationCode("");
    }
  };

  const disable2FA = async () => {
    const validation = tokenSchema.safeParse(verificationCode);
    if (!validation.success) {
      toast({
        variant: "destructive",
        title: "Invalid code",
        description: "Please enter a valid 6-digit code",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-2fa", {
        body: { action: "disable", token: verificationCode },
      });

      if (error) throw error;

      if (data.success) {
        setIsEnabled(false);
        setDisableMode(false);
        toast({
          title: "2FA Disabled",
          description: "Two-factor authentication has been disabled.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Failed to disable",
          description: data.error || "Invalid code. Please try again.",
        });
      }
    } catch (err) {
      console.error("Error disabling 2FA:", err);
      toast({
        variant: "destructive",
        title: "Failed to disable",
        description: "Could not disable 2FA. Please try again.",
      });
    } finally {
      setIsProcessing(false);
      setVerificationCode("");
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: `${label} copied to clipboard`,
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Two-Factor Authentication</CardTitle>
              <CardDescription>Add an extra layer of security to your admin account</CardDescription>
            </div>
          </div>
          <Badge variant={isEnabled ? "default" : "secondary"} className="gap-1">
            {isEnabled ? (
              <>
                <ShieldCheck className="h-3 w-3" />
                Enabled
              </>
            ) : (
              <>
                <ShieldOff className="h-3 w-3" />
                Disabled
              </>
            )}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {!setupMode && !disableMode && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {isEnabled
                ? "Your account is protected with two-factor authentication. You will need to enter a code from your authenticator app when accessing admin features."
                : "Enable two-factor authentication to add an extra layer of security. You'll need an authenticator app like Google Authenticator or Authy."}
            </p>
            <div className="flex gap-2">
              {isEnabled ? (
                <Button
                  variant="destructive"
                  onClick={() => setDisableMode(true)}
                  disabled={isProcessing}
                >
                  Disable 2FA
                </Button>
              ) : (
                <Button onClick={startSetup} disabled={isProcessing}>
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Setting up...
                    </>
                  ) : (
                    "Enable 2FA"
                  )}
                </Button>
              )}
            </div>
          </div>
        )}

        {setupMode && (
          <div className="space-y-6">
            <div className="space-y-4">
              <h4 className="font-medium">Step 1: Scan QR Code</h4>
              <p className="text-sm text-muted-foreground">
                Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
              </p>
              <div className="flex justify-center rounded-lg border bg-white p-4">
                <QRCodeSVG value={otpauth} size={180} />
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Manual Entry (if QR doesn't work)</h4>
              <div className="flex items-center gap-2">
                <Input
                  type={showSecret ? "text" : "password"}
                  value={secret}
                  readOnly
                  className="font-mono"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowSecret(!showSecret)}
                >
                  {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(secret, "Secret")}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Backup Codes</h4>
              <p className="text-sm text-muted-foreground">
                Save these backup codes in a secure place. You can use them if you lose access to your authenticator app.
              </p>
              <div className="grid grid-cols-2 gap-2 rounded-lg border bg-muted/50 p-3">
                {backupCodes.map((code, i) => (
                  <code key={i} className="text-sm font-mono">
                    {code}
                  </code>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(backupCodes.join("\n"), "Backup codes")}
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy All
              </Button>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Step 2: Verify Code</h4>
              <p className="text-sm text-muted-foreground">
                Enter the 6-digit code from your authenticator app to complete setup
              </p>
              <div className="flex gap-2">
                <Input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="000000"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                  className="w-32 text-center font-mono text-lg tracking-widest"
                />
                <Button onClick={verifyAndEnable} disabled={isProcessing || verificationCode.length !== 6}>
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Verify & Enable"
                  )}
                </Button>
              </div>
            </div>

            <Button variant="ghost" onClick={() => setSetupMode(false)}>
              Cancel
            </Button>
          </div>
        )}

        {disableMode && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Enter your current 2FA code to disable two-factor authentication.
            </p>
            <div className="flex gap-2">
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="000000"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                className="w-32 text-center font-mono text-lg tracking-widest"
              />
              <Button
                variant="destructive"
                onClick={disable2FA}
                disabled={isProcessing || verificationCode.length !== 6}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Disabling...
                  </>
                ) : (
                  "Disable 2FA"
                )}
              </Button>
            </div>
            <Button variant="ghost" onClick={() => setDisableMode(false)}>
              Cancel
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
