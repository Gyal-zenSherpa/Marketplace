import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export function useWishlist() {
  const { user } = useAuth();
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  const fetchWishlist = useCallback(async () => {
    if (!user) {
      setWishlistIds(new Set());
      return;
    }

    try {
      const { data, error } = await supabase
        .from("wishlists")
        .select("product_id")
        .eq("user_id", user.id);

      if (error) throw error;

      setWishlistIds(new Set(data?.map((item) => item.product_id) || []));
    } catch (error) {
      console.error("Error fetching wishlist:", error);
    }
  }, [user]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const toggleWishlist = async (productId: string) => {
    if (!user) {
      toast.error("Please sign in to add items to your wishlist");
      return false;
    }

    setIsLoading(true);
    const isInWishlist = wishlistIds.has(productId);

    try {
      if (isInWishlist) {
        const { error } = await supabase
          .from("wishlists")
          .delete()
          .eq("user_id", user.id)
          .eq("product_id", productId);

        if (error) throw error;

        setWishlistIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(productId);
          return newSet;
        });
        toast.success("Removed from wishlist");
      } else {
        const { error } = await supabase.from("wishlists").insert({
          user_id: user.id,
          product_id: productId,
        });

        if (error) throw error;

        setWishlistIds((prev) => new Set(prev).add(productId));
        toast.success("Added to wishlist");
      }
      return true;
    } catch (error) {
      console.error("Error updating wishlist:", error);
      toast.error("Failed to update wishlist");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const isInWishlist = (productId: string) => wishlistIds.has(productId);

  return {
    wishlistIds,
    isLoading,
    toggleWishlist,
    isInWishlist,
    refetch: fetchWishlist,
  };
}
