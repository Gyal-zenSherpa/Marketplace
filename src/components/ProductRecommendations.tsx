import { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard } from "./ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Product } from "@/types/product";

interface DBProduct {
  id: string;
  name: string;
  brand: string;
  price: number;
  original_price: number | null;
  image: string | null;
  category: string;
  rating: number | null;
  reviews: number | null;
  in_stock: boolean | null;
  description: string | null;
}

interface ProductRecommendationsProps {
  userPreferences?: string;
  currentProductId?: string;
}

export function ProductRecommendations({ 
  userPreferences = "popular products",
  currentProductId 
}: ProductRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const mapToProduct = (p: DBProduct): Product => ({
    id: p.id,
    name: p.name,
    brand: p.brand,
    price: p.price,
    originalPrice: p.original_price || undefined,
    image: p.image || "https://via.placeholder.com/300",
    category: p.category,
    rating: p.rating || 0,
    reviews: p.reviews || 0,
    inStock: p.in_stock ?? true,
    description: p.description || "",
  });

  useEffect(() => {
    fetchRecommendations();
  }, [userPreferences, currentProductId]);

  const fetchRecommendations = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("product-recommendations", {
        body: { 
          userPreferences, 
          currentProductId,
          limit: 4 
        }
      });

      if (error) throw error;
      
      if (data?.recommendations) {
        setRecommendations(data.recommendations.map(mapToProduct));
      }
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      // Fallback: fetch some products directly
      const { data: fallback } = await supabase
        .from("products")
        .select("*")
        .eq("in_stock", true)
        .limit(4);
      
      if (fallback) {
        setRecommendations(fallback.map(mapToProduct));
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">Recommended for You</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="h-48 w-full rounded-xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <section className="py-12 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-bold text-foreground">Recommended for You</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {recommendations.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
