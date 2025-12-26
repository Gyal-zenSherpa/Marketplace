import { forwardRef, useState } from "react";
import { Star, ShoppingBag, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Product } from "@/types/product";
import { useCart } from "@/context/CartContext";

interface ProductCardProps {
  product: Product;
  index: number;
}

export const ProductCard = forwardRef<HTMLDivElement, ProductCardProps>(
  ({ product, index }, ref) => {
    const { addToCart } = useCart();
    const [isLiked, setIsLiked] = useState(false);
  
  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <div
      ref={ref}
      className="group relative flex flex-col overflow-hidden rounded-xl bg-card shadow-card transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1 animate-fade-in"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-secondary">
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        
        {/* Badges */}
        <div className="absolute left-3 top-3 flex flex-col gap-2">
          {discount > 0 && (
            <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-bold text-accent-foreground">
              -{discount}%
            </span>
          )}
          {!product.inStock && (
            <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
              Sold Out
            </span>
          )}
        </div>
        
        {/* Like button */}
        <button
          onClick={() => setIsLiked(!isLiked)}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-card/80 backdrop-blur-sm transition-all hover:bg-card hover:scale-110"
        >
          <Heart
            className={`h-4 w-4 transition-colors ${
              isLiked ? "fill-destructive text-destructive" : "text-muted-foreground"
            }`}
          />
        </button>
        
        {/* Quick add overlay */}
        <div className="absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-foreground/80 to-transparent p-4 transition-transform duration-300 group-hover:translate-y-0">
          <Button
            variant="secondary"
            className="w-full bg-card hover:bg-card/90"
            onClick={() => addToCart(product)}
            disabled={!product.inStock}
          >
            <ShoppingBag className="h-4 w-4" />
            {product.inStock ? "Add to Cart" : "Out of Stock"}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        {/* Brand */}
        <span className="mb-1 text-xs font-semibold uppercase tracking-wider text-primary">
          {product.brand}
        </span>
        
        {/* Name */}
        <h3 className="mb-2 line-clamp-2 font-semibold text-card-foreground group-hover:text-primary transition-colors">
          {product.name}
        </h3>
        
        {/* Description */}
        <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
          {product.description}
        </p>
        
        {/* Rating */}
        <div className="mb-3 flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-accent text-accent" />
            <span className="text-sm font-medium text-foreground">{product.rating}</span>
          </div>
          <span className="text-sm text-muted-foreground">
            ({product.reviews} reviews)
          </span>
        </div>
        
        {/* Price */}
        <div className="mt-auto flex items-baseline gap-2">
          <span className="text-xl font-bold text-foreground">
            ${product.price.toFixed(2)}
          </span>
          {product.originalPrice && (
            <span className="text-sm text-muted-foreground line-through">
              ${product.originalPrice.toFixed(2)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
});

ProductCard.displayName = "ProductCard";
