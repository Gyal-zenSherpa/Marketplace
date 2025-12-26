import { useState } from "react";
import { SlidersHorizontal, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface FilterState {
  priceRange: [number, number];
  inStockOnly: boolean;
  sortBy: string;
}

interface ProductFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  maxPrice: number;
}

export function ProductFilters({
  filters,
  onFiltersChange,
  maxPrice,
}: ProductFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handlePriceChange = (value: number[]) => {
    onFiltersChange({
      ...filters,
      priceRange: [value[0], value[1]],
    });
  };

  const handleStockChange = (checked: boolean) => {
    onFiltersChange({
      ...filters,
      inStockOnly: checked,
    });
  };

  const handleSortChange = (value: string) => {
    onFiltersChange({
      ...filters,
      sortBy: value,
    });
  };

  const handleReset = () => {
    onFiltersChange({
      priceRange: [0, maxPrice],
      inStockOnly: false,
      sortBy: "featured",
    });
  };

  return (
    <div className="mb-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <Button
          variant="outline"
          onClick={() => setIsExpanded(!isExpanded)}
          className="gap-2"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>

        <div className="flex items-center gap-3">
          <Label htmlFor="sort" className="text-sm text-muted-foreground whitespace-nowrap">
            Sort by:
          </Label>
          <Select value={filters.sortBy} onValueChange={handleSortChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="featured">Featured</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
              <SelectItem value="rating">Highest Rated</SelectItem>
              <SelectItem value="newest">Newest First</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div
        className={cn(
          "overflow-hidden transition-all duration-300",
          isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="grid gap-6 md:grid-cols-3">
            {/* Price Range */}
            <div className="space-y-4">
              <Label className="text-sm font-medium">Price Range</Label>
              <div className="px-2">
                <Slider
                  value={[filters.priceRange[0], filters.priceRange[1]]}
                  onValueChange={handlePriceChange}
                  max={maxPrice}
                  min={0}
                  step={10}
                  className="w-full"
                />
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>${filters.priceRange[0]}</span>
                <span>${filters.priceRange[1]}</span>
              </div>
            </div>

            {/* In Stock Only */}
            <div className="space-y-4">
              <Label className="text-sm font-medium">Availability</Label>
              <div className="flex items-center gap-3">
                <Switch
                  id="in-stock"
                  checked={filters.inStockOnly}
                  onCheckedChange={handleStockChange}
                />
                <Label htmlFor="in-stock" className="text-sm cursor-pointer">
                  In Stock Only
                </Label>
              </div>
            </div>

            {/* Reset Button */}
            <div className="flex items-end">
              <Button variant="ghost" onClick={handleReset} className="w-full md:w-auto">
                Reset Filters
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
