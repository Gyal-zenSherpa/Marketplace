import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Copy, Users, Gift, Share2, CheckCircle, Clock, XCircle } from "lucide-react";
import { format } from "date-fns";

interface Referral {
  id: string;
  referred_email: string;
  referral_code: string;
  status: string;
  points_awarded: number;
  created_at: string;
}

export function ReferralSection() {
  const { user } = useAuth();
  const [referralCode, setReferralCode] = useState<string>("");
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchReferralCode();
      fetchReferrals();
    }
  }, [user]);

  const fetchReferralCode = async () => {
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("referral_code")
      .eq("user_id", user.id)
      .single();

    if (profile?.referral_code) {
      setReferralCode(profile.referral_code);
    } else {
      // Generate a new referral code
      const newCode = `REF${user.id.slice(0, 6).toUpperCase()}${Date.now().toString(36).toUpperCase().slice(-4)}`;
      await supabase
        .from("profiles")
        .update({ referral_code: newCode })
        .eq("user_id", user.id);
      setReferralCode(newCode);
    }
  };

  const fetchReferrals = async () => {
    if (!user) return;

    const { data } = await supabase
      .from("referrals")
      .select("*")
      .eq("referrer_id", user.id)
      .order("created_at", { ascending: false });

    if (data) {
      setReferrals(data);
    }
  };

  const copyReferralLink = () => {
    const link = `${window.location.origin}/auth?ref=${referralCode}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Link copied!",
      description: "Share this link with your friends to earn points.",
    });
  };

  const sendInvite = async () => {
    if (!inviteEmail || !user) return;

    setLoading(true);
    try {
      const inviteCode = `INV${Date.now().toString(36).toUpperCase()}`;
      
      const { error } = await supabase.from("referrals").insert({
        referrer_id: user.id,
        referred_email: inviteEmail,
        referral_code: inviteCode,
        status: "pending",
      });

      if (error) throw error;

      toast({
        title: "Invite sent!",
        description: `Invitation created for ${inviteEmail}`,
      });
      
      setInviteEmail("");
      fetchReferrals();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create invitation",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case "expired":
        return (
          <Badge className="bg-red-500/10 text-red-600 border-red-500/20">
            <XCircle className="h-3 w-3 mr-1" />
            Expired
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const totalEarned = referrals
    .filter((r) => r.status === "completed")
    .reduce((acc, r) => acc + r.points_awarded, 0);

  return (
    <div className="space-y-6">
      {/* Share Your Code */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary" />
            Share & Earn
          </CardTitle>
          <CardDescription>
            Invite friends and earn 100 points when they make their first purchase
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={`${window.location.origin}/auth?ref=${referralCode}`}
              readOnly
              className="font-mono text-sm"
            />
            <Button onClick={copyReferralLink} variant="secondary">
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </Button>
          </div>

          <div className="p-4 rounded-lg bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
                <Gift className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold">Your Referral Code</p>
                <p className="text-2xl font-bold text-primary font-mono">{referralCode}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invite by Email */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-500" />
            Invite by Email
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="friend@example.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
            />
            <Button onClick={sendInvite} disabled={loading || !inviteEmail}>
              {loading ? "Sending..." : "Send Invite"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-primary">{referrals.length}</p>
            <p className="text-sm text-muted-foreground">Total Invites</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-green-600">{totalEarned}</p>
            <p className="text-sm text-muted-foreground">Points Earned</p>
          </CardContent>
        </Card>
      </div>

      {/* Referral History */}
      {referrals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Referral History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {referrals.map((referral) => (
                <div
                  key={referral.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div>
                    <p className="font-medium">{referral.referred_email}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(referral.created_at), "MMM d, yyyy")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {referral.points_awarded > 0 && (
                      <span className="text-green-600 font-semibold">
                        +{referral.points_awarded} pts
                      </span>
                    )}
                    {getStatusBadge(referral.status)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
