import { forwardRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Star, ShoppingBag, Heart, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Product } from "@/types/product";
import { useCart } from "@/context/CartContext";
import { useWishlistContext } from "@/context/WishlistContext";
import { useBrowsingHistory } from "@/hooks/useBrowsingHistory";

interface ProductCardProps {
  product: Product;
  index: number;
}

export const ProductCard = forwardRef<HTMLDivElement, ProductCardProps>(
  ({ product, index }, ref) => {
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const { isInWishlist, toggleWishlist, isLoading: wishlistLoading } = useWishlistContext();
    const { trackProductView } = useBrowsingHistory();
    const isLiked = isInWishlist(product.id);

    // Track product view when card is visible (simple implementation)
    useEffect(() => {
      const timeout = setTimeout(() => {
        trackProductView(product.id);
      }, 2000); // Track after 2 seconds of viewing
      return () => clearTimeout(timeout);
    }, [product.id, trackProductView]);
  
    const discount = product.originalPrice
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : 0;

    const handleWishlistToggle = async (e: React.MouseEvent) => {
      e.stopPropagation();
      await toggleWishlist(product.id);
    };

    const handleBuyNow = (e: React.MouseEvent) => {
      e.stopPropagation();
      addToCart(product);
      navigate("/checkout");
    };

    return (
      <div
        ref={ref}
        className="group relative flex flex-col overflow-hidden rounded-xl bg-card shadow-card transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1 animate-fade-in cursor-pointer"
        style={{ animationDelay: `${index * 100}ms` }}
        onClick={() => navigate(`/product/${product.id}`)}
      >
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-secondary">
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          
          {/* Badges */}
          <div className="absolute left-2 md:left-3 top-2 md:top-3 flex flex-col gap-1.5 md:gap-2">
            {discount > 0 && (
              <span className="rounded-full bg-accent px-2 py-0.5 md:px-2.5 md:py-1 text-[10px] md:text-xs font-bold text-accent-foreground">
                -{discount}%
              </span>
            )}
            {!product.inStock && (
              <span className="rounded-full bg-muted px-2 py-0.5 md:px-2.5 md:py-1 text-[10px] md:text-xs font-semibold text-muted-foreground">
                Sold Out
              </span>
            )}
          </div>
          
          {/* Action buttons */}
          <div className="absolute right-2 md:right-3 top-2 md:top-3 flex flex-col gap-1.5 md:gap-2">
            {/* Like/Wishlist button */}
            <button
              onClick={handleWishlistToggle}
              disabled={wishlistLoading}
              className="flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-full bg-card/80 backdrop-blur-sm transition-all hover:bg-card hover:scale-110 disabled:opacity-50"
            >
              <Heart
                className={`h-3.5 w-3.5 md:h-4 md:w-4 transition-colors ${
                  isLiked ? "fill-destructive text-destructive" : "text-muted-foreground"
                }`}
              />
            </button>
          </div>
          
          {/* Quick actions overlay - always visible on hover */}
          <div className="absolute inset-x-0 bottom-0 translate-y-full p-2 md:p-3 transition-transform duration-300 group-hover:translate-y-0">
            <div className="flex gap-1.5 md:gap-2">
              <Button
                variant="secondary"
                size="sm"
                className="flex-1 bg-yellow-400 text-yellow-900 font-semibold hover:bg-yellow-500 transition-colors duration-200 text-xs md:text-sm h-8 md:h-9"
                onClick={(e) => {
                  e.stopPropagation();
                  addToCart(product);
                }}
                disabled={!product.inStock}
              >
                <ShoppingBag className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1" />
                Add
              </Button>
              <Button
                size="sm"
                className="flex-1 gradient-hero text-primary-foreground font-semibold text-xs md:text-sm h-8 md:h-9"
                onClick={handleBuyNow}
                disabled={!product.inStock}
              >
                <Zap className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1" />
                Buy Now
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col p-3 md:p-4">
          {/* Brand */}
          <span className="mb-0.5 md:mb-1 text-[10px] md:text-xs font-semibold uppercase tracking-wider text-primary">
            {product.brand}
          </span>
          
          {/* Name */}
          <h3 className="mb-1.5 md:mb-2 line-clamp-2 text-sm md:text-base font-semibold text-card-foreground group-hover:text-primary transition-colors">
            {product.name}
          </h3>
          
          {/* Description - hidden on mobile */}
          <p className="mb-2 md:mb-3 line-clamp-2 text-xs md:text-sm text-muted-foreground hidden sm:block">
            {product.description}
          </p>
          
          {/* Rating */}
          <div className="mb-2 md:mb-3 flex items-center gap-1.5 md:gap-2">
            <div className="flex items-center gap-0.5 md:gap-1">
              <Star className="h-3.5 w-3.5 md:h-4 md:w-4 fill-accent text-accent" />
              <span className="text-xs md:text-sm font-medium text-foreground">{product.rating}</span>
            </div>
            <span className="text-[10px] md:text-sm text-muted-foreground">
              ({product.reviews})
            </span>
          </div>
          
          {/* Price */}
          <div className="mt-auto flex items-baseline gap-1.5 md:gap-2">
            <span className="text-base md:text-xl font-bold text-foreground">
              Rs. {product.price.toFixed(0)}
            </span>
            {product.originalPrice && (
              <span className="text-xs md:text-sm text-muted-foreground line-through">
                Rs. {product.originalPrice.toFixed(0)}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }
);

ProductCard.displayName = "ProductCard";
