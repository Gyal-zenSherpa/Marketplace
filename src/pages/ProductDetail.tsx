import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Star, ShoppingBag, Heart, ArrowLeft, Truck, Shield, RotateCcw, Zap, MessageSquare } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CartSidebar } from "@/components/CartSidebar";
import { SocialShare } from "@/components/SocialShare";
import { ProductReviews } from "@/components/reviews/ProductReviews";
import { useCart } from "@/context/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { products as staticProducts } from "@/data/products";
import { Product } from "@/types/product";

export default function ProductDetail() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);

  // Check if user purchased this product
  useEffect(() => {
    const checkPurchase = async () => {
      if (!user || !id) return;
      const { data: orders } = await supabase
        .from("orders")
        .select("id, status, order_items!inner(product_id)")
        .eq("user_id", user.id)
        .eq("status", "delivered");

      const purchased = orders?.some((order: any) =>
        order.order_items.some((item: any) => item.product_id === id)
      );
      setHasPurchased(!!purchased);

      // Check if already reviewed
      const { data: review } = await supabase
        .from("product_reviews")
        .select("id")
        .eq("product_id", id)
        .eq("user_id", user.id)
        .maybeSingle();
      setHasReviewed(!!review);
    };
    checkPurchase();
  }, [user, id]);

  useEffect(() => {
    const fetchProduct = async () => {
      // First try to fetch from database
      const { data } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (data) {
        setProduct({
          id: data.id,
          name: data.name,
          brand: data.brand,
          price: Number(data.price),
          originalPrice: data.original_price ? Number(data.original_price) : undefined,
          description: data.description || "",
          image: data.image || "",
          category: data.category,
          inStock: data.in_stock ?? true,
          rating: Number(data.rating) || 0,
          reviews: data.reviews || 0,
        });
      } else {
        // Fallback to static products
        const staticProduct = staticProducts.find((p) => p.id === id);
        if (staticProduct) {
          setProduct(staticProduct);
        }
      }
      setLoading(false);
    };

    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Product Not Found</h1>
          <Button onClick={() => navigate("/")}>Back to Home</Button>
        </div>
        <Footer />
      </div>
    );
  }

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addToCart(product);
    }
  };

  const handleBuyNow = () => {
    for (let i = 0; i < quantity; i++) {
      addToCart(product);
    }
    navigate("/checkout");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Products
        </button>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* Product Image */}
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-secondary">
            <img
              src={product.image}
              alt={product.name}
              className="h-full w-full object-cover"
            />
            {discount > 0 && (
              <span className="absolute left-4 top-4 rounded-full bg-accent px-3 py-1.5 text-sm font-bold text-accent-foreground">
                -{discount}% OFF
              </span>
            )}
            <button
              onClick={() => setIsLiked(!isLiked)}
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-card/80 backdrop-blur-sm transition-all hover:bg-card hover:scale-110"
            >
              <Heart
                className={`h-5 w-5 transition-colors ${
                  isLiked ? "fill-destructive text-destructive" : "text-muted-foreground"
                }`}
              />
            </button>
          </div>

          {/* Product Info */}
          <div className="flex flex-col">
            <span className="text-sm font-semibold uppercase tracking-wider text-primary mb-2">
              {product.brand}
            </span>
            <h1 className="text-3xl font-bold text-foreground mb-4">{product.name}</h1>

            {/* Rating */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i < Math.floor(product.rating)
                        ? "fill-accent text-accent"
                        : "text-muted-foreground"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                {product.rating} ({product.reviews} reviews)
              </span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-3xl font-bold text-foreground">
                Rs. {product.price.toFixed(2)}
              </span>
              {product.originalPrice && (
                <span className="text-xl text-muted-foreground line-through">
                  Rs. {product.originalPrice.toFixed(2)}
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-muted-foreground mb-8 leading-relaxed">
              {product.description}
            </p>

            {/* Quantity & Actions */}
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center border border-border rounded-lg">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 py-2 text-foreground hover:bg-secondary transition-colors"
                >
                  -
                </button>
                <span className="px-4 py-2 font-medium text-foreground">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-4 py-2 text-foreground hover:bg-secondary transition-colors"
                >
                  +
                </button>
              </div>
              <Button
                onClick={handleAddToCart}
                disabled={!product.inStock}
                variant="outline"
                className="flex-1 h-12"
              >
                <ShoppingBag className="h-5 w-5 mr-2" />
                {product.inStock ? "Add to Cart" : "Out of Stock"}
              </Button>
            </div>

            {/* Buy Now Button */}
            <Button
              onClick={handleBuyNow}
              disabled={!product.inStock}
              className="w-full gradient-hero text-primary-foreground h-12 mb-6"
            >
              <Zap className="h-5 w-5 mr-2" />
              Buy Now
            </Button>

            {/* Social Share */}
            <div className="pt-6 border-t border-border">
              <SocialShare
                url={`${window.location.origin}${location.pathname}`}
                title={`Check out ${product.name} by ${product.brand}`}
                description={product.description}
              />
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-border">
              <div className="flex items-center gap-3 text-muted-foreground">
                <Truck className="h-5 w-5 text-primary" />
                <span className="text-sm">Free Shipping</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <Shield className="h-5 w-5 text-primary" />
                <span className="text-sm">Secure Payment</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <RotateCcw className="h-5 w-5 text-primary" />
                <span className="text-sm">Easy Returns</span>
              </div>
            </div>
          </div>
        </div>

        {/* Review Prompt for Purchased Products */}
        {hasPurchased && !hasReviewed && (
          <div className="mt-8 p-4 sm:p-6 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-3 mb-2">
              <MessageSquare className="h-6 w-6 text-amber-600" />
              <h3 className="font-semibold text-foreground">You purchased this product!</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Your order has been delivered. Share your experience — your review will help others make better decisions.
            </p>
            <Button
              onClick={() => {
                const reviewSection = document.querySelector('[data-review-section]');
                reviewSection?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              <Star className="h-4 w-4 mr-2" />
              Leave a Review
            </Button>
          </div>
        )}

        {/* Product Reviews Section */}
        {id && (
          <div className="mt-16" data-review-section>
            <ProductReviews productId={id} />
          </div>
        )}
      </main>
      <CartSidebar />
      <Footer />
    </div>
  );
}
