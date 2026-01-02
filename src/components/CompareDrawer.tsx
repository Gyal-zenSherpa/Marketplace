import { X, Star, Check, Minus, ShoppingBag, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useCompare } from "@/context/CompareContext";
import { useCart } from "@/context/CartContext";

export function CompareDrawer() {
  const { compareItems, removeFromCompare, clearCompare, isCompareOpen, setIsCompareOpen } = useCompare();
  const { addToCart } = useCart();

  const specs = [
    { label: "Brand", key: "brand" },
    { label: "Category", key: "category" },
    { label: "Price", key: "price", format: (v: number) => `$${v.toFixed(2)}` },
    { label: "Original Price", key: "originalPrice", format: (v: number | undefined) => v ? `$${v.toFixed(2)}` : "-" },
    { label: "Rating", key: "rating", format: (v: number) => `${v} / 5` },
    { label: "Reviews", key: "reviews" },
    { label: "In Stock", key: "inStock", format: (v: boolean) => v ? "Yes" : "No" },
  ];

  return (
    <Sheet open={isCompareOpen} onOpenChange={setIsCompareOpen}>
      <SheetContent side="bottom" className="h-[80vh] overflow-y-auto">
        <SheetHeader className="flex flex-row items-center justify-between pb-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Compare Products ({compareItems.length}/3)
          </SheetTitle>
          {compareItems.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearCompare}>
              Clear All
            </Button>
          )}
        </SheetHeader>

        {compareItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Scale className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No products to compare</h3>
            <p className="text-muted-foreground">Add products to compare by clicking the compare icon on product cards.</p>
          </div>
        ) : (
          <div className="mt-6">
            {/* Product Images & Names */}
            <div className="grid gap-4" style={{ gridTemplateColumns: `150px repeat(${compareItems.length}, 1fr)` }}>
              <div className="font-semibold text-muted-foreground">Product</div>
              {compareItems.map((product) => (
                <div key={product.id} className="relative">
                  <button
                    onClick={() => removeFromCompare(product.id)}
                    className="absolute -top-2 -right-2 z-10 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:bg-destructive/90"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  <div className="aspect-square rounded-lg overflow-hidden bg-secondary mb-3">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <h4 className="font-semibold text-foreground line-clamp-2 text-sm">{product.name}</h4>
                  <p className="text-xs text-primary font-medium uppercase">{product.brand}</p>
                </div>
              ))}
            </div>

            {/* Specs Comparison */}
            <div className="mt-6 border-t pt-4 space-y-0">
              {specs.map((spec, index) => (
                <div
                  key={spec.key}
                  className={`grid gap-4 py-3 ${index % 2 === 0 ? "bg-secondary/30" : ""}`}
                  style={{ gridTemplateColumns: `150px repeat(${compareItems.length}, 1fr)` }}
                >
                  <div className="font-medium text-muted-foreground text-sm px-2">{spec.label}</div>
                  {compareItems.map((product) => {
                    const value = product[spec.key as keyof typeof product];
                    const displayValue = spec.format
                      ? spec.format(value as never)
                      : value?.toString() || "-";
                    
                    return (
                      <div key={product.id} className="text-sm text-foreground px-2">
                        {spec.key === "inStock" ? (
                          value ? (
                            <span className="flex items-center gap-1 text-green-600">
                              <Check className="h-4 w-4" /> In Stock
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-destructive">
                              <Minus className="h-4 w-4" /> Out of Stock
                            </span>
                          )
                        ) : spec.key === "rating" ? (
                          <span className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-accent text-accent" />
                            {displayValue}
                          </span>
                        ) : (
                          displayValue
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Add to Cart Buttons */}
            <div
              className="grid gap-4 mt-6 pt-4 border-t"
              style={{ gridTemplateColumns: `150px repeat(${compareItems.length}, 1fr)` }}
            >
              <div></div>
              {compareItems.map((product) => (
                <Button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  disabled={!product.inStock}
                  className="bg-yellow-400 text-yellow-900 hover:bg-yellow-500"
                >
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  Add to Cart
                </Button>
              ))}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
