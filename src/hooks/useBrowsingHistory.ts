import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

export function useBrowsingHistory() {
  const { user } = useAuth();

  const trackProductView = useCallback(
    async (productId: string) => {
      if (!user) return;

      try {
        // Check if product was already viewed
        const { data: existing } = await supabase
          .from("browsing_history")
          .select("id, view_count")
          .eq("user_id", user.id)
          .eq("product_id", productId)
          .maybeSingle();

        if (existing) {
          // Update view count and timestamp
          await supabase
            .from("browsing_history")
            .update({
              view_count: existing.view_count + 1,
              viewed_at: new Date().toISOString(),
            })
            .eq("id", existing.id);
        } else {
          // Insert new record
          await supabase.from("browsing_history").insert({
            user_id: user.id,
            product_id: productId,
          });
        }
      } catch (error) {
        console.error("Error tracking product view:", error);
      }
    },
    [user]
  );

  const getRecentlyViewed = useCallback(
    async (limit = 10) => {
      if (!user) return [];

      try {
        const { data, error } = await supabase
          .from("browsing_history")
          .select("product_id, viewed_at, products(*)")
          .eq("user_id", user.id)
          .order("viewed_at", { ascending: false })
          .limit(limit);

        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error("Error fetching browsing history:", error);
        return [];
      }
    },
    [user]
  );

  const getMostViewed = useCallback(
    async (limit = 10) => {
      if (!user) return [];

      try {
        const { data, error } = await supabase
          .from("browsing_history")
          .select("product_id, view_count, products(*)")
          .eq("user_id", user.id)
          .order("view_count", { ascending: false })
          .limit(limit);

        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error("Error fetching most viewed products:", error);
        return [];
      }
    },
    [user]
  );

  const getPreferredCategories = useCallback(async () => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from("browsing_history")
        .select("products(category)")
        .eq("user_id", user.id);

      if (error) throw error;

      // Count categories
      const categoryCounts: Record<string, number> = {};
      data?.forEach((item) => {
        const category = (item.products as { category?: string })?.category;
        if (category) {
          categoryCounts[category] = (categoryCounts[category] || 0) + 1;
        }
      });

      // Sort by count
      return Object.entries(categoryCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([category]) => category);
    } catch (error) {
      console.error("Error getting preferred categories:", error);
      return [];
    }
  }, [user]);

  return {
    trackProductView,
    getRecentlyViewed,
    getMostViewed,
    getPreferredCategories,
  };
}
