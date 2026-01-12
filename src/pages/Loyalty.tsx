import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { LoyaltyProgress } from "@/components/loyalty/LoyaltyWidget";
import { ReferralSection } from "@/components/referral/ReferralSection";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Coins,
  Gift,
  Award,
  History,
  ShoppingBag,
  Star,
  Users,
} from "lucide-react";
import { format } from "date-fns";

interface PointsTransaction {
  id: string;
  points: number;
  type: string;
  source: string;
  description: string | null;
  created_at: string;
}

interface Reward {
  id: string;
  name: string;
  description: string | null;
  points_required: number;
  reward_type: string;
  reward_value: number | null;
}

interface LoyaltyTier {
  name: string;
  min_points: number;
  badge_color: string;
  benefits: string[];
}

export default function Loyalty() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<PointsTransaction[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [tiers, setTiers] = useState<LoyaltyTier[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    if (!user) return;

    const [transRes, rewardsRes, tiersRes] = await Promise.all([
      supabase
        .from("points_transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50),
      supabase.from("loyalty_rewards").select("*").eq("is_active", true),
      supabase.from("loyalty_tiers").select("*").order("min_points"),
    ]);

    if (transRes.data) setTransactions(transRes.data);
    if (rewardsRes.data) setRewards(rewardsRes.data);
    if (tiersRes.data) setTiers(tiersRes.data);

    setLoading(false);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "earn":
        return <ShoppingBag className="h-4 w-4 text-green-500" />;
      case "bonus":
        return <Gift className="h-4 w-4 text-blue-500" />;
      case "redeem":
        return <Gift className="h-4 w-4 text-orange-500" />;
      case "expire":
        return <History className="h-4 w-4 text-red-500" />;
      default:
        return <Coins className="h-4 w-4 text-amber-500" />;
    }
  };

  const earnWays = [
    {
      icon: <ShoppingBag className="h-8 w-8 text-primary" />,
      title: "Make Purchases",
      description: "Earn 1 point for every Rs. 100 spent",
    },
    {
      icon: <Star className="h-8 w-8 text-yellow-500" />,
      title: "Write Reviews",
      description: "Earn 25 points per verified review",
    },
    {
      icon: <Users className="h-8 w-8 text-blue-500" />,
      title: "Refer Friends",
      description: "Earn 100 points per referral",
    },
    {
      icon: <Gift className="h-8 w-8 text-pink-500" />,
      title: "First Order Bonus",
      description: "Earn 50 bonus points on your first order",
    },
  ];

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </button>

        <div className="flex items-center gap-4 mb-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500">
            <Coins className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Loyalty & Rewards</h1>
            <p className="text-muted-foreground">Earn points, unlock rewards, save more!</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Points Summary */}
            <LoyaltyProgress />

            <Tabs defaultValue="earn" className="space-y-4">
              <TabsList className="grid grid-cols-4 w-full max-w-lg">
                <TabsTrigger value="earn">How to Earn</TabsTrigger>
                <TabsTrigger value="rewards">Rewards</TabsTrigger>
                <TabsTrigger value="referrals">Referrals</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>

              <TabsContent value="earn">
                <div className="grid sm:grid-cols-2 gap-4">
                  {earnWays.map((way, index) => (
                    <Card key={index}>
                      <CardContent className="p-4 flex items-start gap-4">
                        <div className="flex-shrink-0">{way.icon}</div>
                        <div>
                          <h3 className="font-semibold">{way.title}</h3>
                          <p className="text-sm text-muted-foreground">{way.description}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="rewards">
                {rewards.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-8 text-muted-foreground">
                      No rewards available at the moment. Check back soon!
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {rewards.map((reward) => (
                      <Card key={reward.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold">{reward.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                {reward.description}
                              </p>
                            </div>
                            <Badge variant="secondary">
                              <Coins className="h-3 w-3 mr-1" />
                              {reward.points_required}
                            </Badge>
                          </div>
                          <Button className="w-full mt-4" size="sm">
                            Redeem
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="referrals">
                <ReferralSection />
              </TabsContent>

              <TabsContent value="history">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Points History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="text-center py-4 text-muted-foreground">
                        Loading...
                      </div>
                    ) : transactions.length === 0 ? (
                      <div className="text-center py-4 text-muted-foreground">
                        No transactions yet
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {transactions.map((tx) => (
                          <div
                            key={tx.id}
                            className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              {getTypeIcon(tx.type)}
                              <div>
                                <p className="font-medium capitalize">{tx.source}</p>
                                <p className="text-sm text-muted-foreground">
                                  {tx.description ||
                                    format(new Date(tx.created_at), "MMM d, yyyy")}
                                </p>
                              </div>
                            </div>
                            <span
                              className={`font-semibold ${
                                tx.points > 0 ? "text-green-600" : "text-red-600"
                              }`}
                            >
                              {tx.points > 0 ? "+" : ""}
                              {tx.points}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Tiers Sidebar */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Loyalty Tiers
                </CardTitle>
                <CardDescription>
                  Earn more points to unlock better benefits
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {tiers.map((tier) => (
                  <div
                    key={tier.name}
                    className="p-3 rounded-lg border"
                    style={{ borderColor: tier.badge_color }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Award className="h-5 w-5" style={{ color: tier.badge_color }} />
                      <span className="font-semibold">{tier.name}</span>
                      <Badge variant="outline" className="ml-auto text-xs">
                        {tier.min_points}+ pts
                      </Badge>
                    </div>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {tier.benefits.map((benefit, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-green-500">✓</span>
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
