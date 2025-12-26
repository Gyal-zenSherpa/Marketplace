import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { ProductCard } from "./ProductCard";
import { CategoryFilter } from "./CategoryFilter";
import { SearchBar } from "./SearchBar";
import { ProductFilters, FilterState } from "./ProductFilters";
import { products as staticProducts, categories } from "@/data/products";
import { supabase } from "@/integrations/supabase/client";
import { Product } from "@/types/product";

export function ProductGrid() {
  console.log('ProductGrid rendering');
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [allProducts, setAllProducts] = useState<Product[]>(staticProducts);
  
  const maxPrice = useMemo(() => {
    return Math.max(...allProducts.map((p) => p.price), 1000);
  }, [allProducts]);

  const [filters, setFilters] = useState<FilterState>({
    priceRange: [0, 10000],
    inStockOnly: false,
    sortBy: "featured",
  });

  // Update price range when products load
  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      priceRange: [0, maxPrice],
    }));
  }, [maxPrice]);

  useEffect(() => {
    const fetchProducts = async () => {
      const { data } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (data && data.length > 0) {
        const dbProducts: Product[] = data.map((p) => ({
          id: p.id,
          name: p.name,
          brand: p.brand,
          price: Number(p.price),
          originalPrice: p.original_price ? Number(p.original_price) : undefined,
          description: p.description || "",
          image: p.image || "",
          category: p.category,
          inStock: p.in_stock ?? true,
          rating: Number(p.rating) || 0,
          reviews: p.reviews || 0,
        }));
        setAllProducts([...dbProducts, ...staticProducts]);
      }
    };

    fetchProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    let result = allProducts.filter((product) => {
      const matchesCategory =
        activeCategory === "All" || product.category === activeCategory;

      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        searchQuery === "" ||
        product.name.toLowerCase().includes(searchLower) ||
        product.brand.toLowerCase().includes(searchLower) ||
        product.description.toLowerCase().includes(searchLower);

      const matchesPrice =
        product.price >= filters.priceRange[0] &&
        product.price <= filters.priceRange[1];

      const matchesStock = !filters.inStockOnly || product.inStock;

      return matchesCategory && matchesSearch && matchesPrice && matchesStock;
    });

    // Apply sorting
    switch (filters.sortBy) {
      case "price-low":
        result = [...result].sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        result = [...result].sort((a, b) => b.price - a.price);
        break;
      case "rating":
        result = [...result].sort((a, b) => b.rating - a.rating);
        break;
      case "newest":
        // Already sorted by newest from DB, static products at the end
        break;
      case "featured":
      default:
        // Keep original order
        break;
    }

    return result;
  }, [allProducts, activeCategory, searchQuery, filters]);

  return (
    <section className="py-12 md:py-16">
      <div className="container mx-auto px-4">
        <div className="mb-8 text-center">
          <h2 className="mb-3 text-3xl font-bold text-foreground md:text-4xl">
            Featured Products
          </h2>
          <p className="text-muted-foreground">
            Discover our curated selection of quality items
          </p>
        </div>

        <SearchBar searchQuery={searchQuery} onSearchChange={setSearchQuery} />

        <CategoryFilter
          categories={categories}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
        />

        <ProductFilters
          filters={filters}
          onFiltersChange={setFilters}
          maxPrice={maxPrice}
        />

        <div className="mb-4 text-sm text-muted-foreground">
          Showing {filteredProducts.length} product{filteredProducts.length !== 1 ? "s" : ""}
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.map((product, index) => (
            <Link key={product.id} to={`/product/${product.id}`}>
              <ProductCard product={product} index={index} />
            </Link>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-lg text-muted-foreground">
              No products found matching your criteria
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
