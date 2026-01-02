import { useEffect, useState } from "react";
import { Heart, ShoppingBag } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { Product } from "@/types/product";

interface WishlistItem {
  product_id: string;
  products: {
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
  };
}

export default function Wishlist() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [wishlistItems, setWishlistItems] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchWishlist = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from("wishlists")
          .select("product_id, products(*)")
          .eq("user_id", user.id);

        if (error) throw error;

        const products: Product[] = (data as WishlistItem[])?.map((item) => ({
          id: item.products.id,
          name: item.products.name,
          brand: item.products.brand,
          price: item.products.price,
          originalPrice: item.products.original_price || undefined,
          image: item.products.image || "https://via.placeholder.com/300",
          category: item.products.category,
          rating: item.products.rating || 0,
          reviews: item.products.reviews || 0,
          inStock: item.products.in_stock ?? true,
          description: item.products.description || "",
        })) || [];

        setWishlistItems(products);
      } catch (error) {
        console.error("Error fetching wishlist:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchWishlist();
    }
  }, [user]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="h-48 w-full rounded-xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Heart className="h-8 w-8 text-destructive fill-destructive" />
          <h1 className="text-3xl font-bold text-foreground">My Wishlist</h1>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="h-48 w-full rounded-xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : wishlistItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Heart className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Your wishlist is empty
            </h2>
            <p className="text-muted-foreground mb-6">
              Start adding products you love by clicking the heart icon
            </p>
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors"
            >
              <ShoppingBag className="h-5 w-5" />
              Browse Products
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {wishlistItems.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
