import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Coins, Award, Gift, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface UserLoyalty {
  total_points: number;
  available_points: number;
  pending_points: number;
  lifetime_points: number;
  current_tier: string;
}

interface LoyaltyTier {
  name: string;
  min_points: number;
  badge_color: string;
  benefits: string[];
}

export function LoyaltyWidget() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loyalty, setLoyalty] = useState<UserLoyalty | null>(null);
  const [tiers, setTiers] = useState<LoyaltyTier[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchLoyaltyData();
    }
  }, [user]);

  const fetchLoyaltyData = async () => {
    if (!user) return;

    // Fetch user loyalty
    const { data: loyaltyData, error: loyaltyError } = await supabase
      .from("user_loyalty")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    // Fetch tiers
    const { data: tiersData } = await supabase
      .from("loyalty_tiers")
      .select("*")
      .order("min_points");

    if (tiersData) {
      setTiers(tiersData);
    }

    if (loyaltyData) {
      setLoyalty(loyaltyData);
    } else if (!loyaltyError) {
      // Initialize loyalty for new user
      const { data: newLoyalty } = await supabase
        .from("user_loyalty")
        .insert({
          user_id: user.id,
          total_points: 100,
          available_points: 100,
          pending_points: 0,
          lifetime_points: 100,
          current_tier: "Bronze",
          signup_bonus_claimed: true,
        })
        .select()
        .single();

      if (newLoyalty) {
        setLoyalty(newLoyalty);
        // Points transaction is logged server-side via RLS (service role only)
      }
    }

    setLoading(false);
  };

  if (!user || loading) return null;

  const currentTier = tiers.find((t) => t.name === loyalty?.current_tier) || tiers[0];
  const nextTier = tiers.find((t) => t.min_points > (loyalty?.total_points || 0));

  const progressToNextTier = nextTier
    ? ((loyalty?.total_points || 0) / nextTier.min_points) * 100
    : 100;

  return (
    <div
      onClick={() => navigate("/loyalty")}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/30 cursor-pointer hover:shadow-md transition-all"
    >
      <Coins className="h-4 w-4 text-amber-600" />
      <span className="font-semibold text-amber-800 dark:text-amber-200">
        {loyalty?.available_points || 0}
      </span>
      <Badge
        variant="outline"
        className="text-xs"
        style={{ borderColor: currentTier?.badge_color, color: currentTier?.badge_color }}
      >
        {currentTier?.name}
      </Badge>
    </div>
  );
}

export function LoyaltyProgress() {
  const { user } = useAuth();
  const [loyalty, setLoyalty] = useState<UserLoyalty | null>(null);
  const [tiers, setTiers] = useState<LoyaltyTier[]>([]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    const [loyaltyRes, tiersRes] = await Promise.all([
      supabase.from("user_loyalty").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("loyalty_tiers").select("*").order("min_points"),
    ]);

    if (loyaltyRes.data) setLoyalty(loyaltyRes.data);
    if (tiersRes.data) setTiers(tiersRes.data);
  };

  if (!user || !loyalty) return null;

  const currentTier = tiers.find((t) => t.name === loyalty.current_tier) || tiers[0];
  const nextTier = tiers.find((t) => t.min_points > loyalty.total_points);

  const pointsToNext = nextTier ? nextTier.min_points - loyalty.total_points : 0;
  const progress = nextTier
    ? ((loyalty.total_points - (currentTier?.min_points || 0)) /
        (nextTier.min_points - (currentTier?.min_points || 0))) *
      100
    : 100;

  return (
    <div className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Award
            className="h-6 w-6"
            style={{ color: currentTier?.badge_color }}
          />
          <span className="font-semibold">{currentTier?.name} Member</span>
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold text-amber-600">
            {loyalty.available_points}
          </span>
          <span className="text-sm text-muted-foreground ml-1">points</span>
        </div>
      </div>

      {nextTier && (
        <>
          <Progress value={progress} className="h-2 mb-2" />
          <p className="text-sm text-muted-foreground">
            {pointsToNext} more points to reach{" "}
            <span style={{ color: nextTier.badge_color }} className="font-semibold">
              {nextTier.name}
            </span>
          </p>
        </>
      )}

      <div className="mt-3 pt-3 border-t border-amber-200 dark:border-amber-800">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Pending Points</span>
          <span>{loyalty.pending_points}</span>
        </div>
        <div className="flex justify-between text-sm mt-1">
          <span className="text-muted-foreground">Lifetime Points</span>
          <span>{loyalty.lifetime_points}</span>
        </div>
      </div>
    </div>
  );
}
