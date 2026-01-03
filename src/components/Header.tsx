import { useState, useEffect } from "react";
import { ShoppingCart, Menu, User, LogOut, Store, Shield, Heart, Scale } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useWishlistContext } from "@/context/WishlistContext";
import { useCompare } from "@/context/CompareContext";
import { supabase } from "@/integrations/supabase/client";

export function Header() {
  const { totalItems, setIsCartOpen } = useCart();
  const { user, profile, signOut } = useAuth();
  const { wishlistIds } = useWishlistContext();
  const { compareItems, setIsCompareOpen } = useCompare();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);

  // Check if user is admin
  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user) {
        setIsAdmin(false);
        return;
      }

      try {
        const { data } = await supabase.rpc('has_role', {
          _user_id: user.id,
          _role: 'admin'
        });
        setIsAdmin(!!data);
      } catch {
        setIsAdmin(false);
      }
    };

    checkAdminRole();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const scrollToProducts = (section?: 'categories' | 'deals') => {
    // Navigate to home if not already there
    if (window.location.pathname !== '/') {
      navigate('/');
      // Wait for navigation then scroll
      setTimeout(() => {
        const productsSection = document.getElementById("products-section");
        if (productsSection) {
          productsSection.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
    } else {
      const productsSection = document.getElementById("products-section");
      if (productsSection) {
        productsSection.scrollIntoView({ behavior: "smooth" });
      }
    }
    
    // Dispatch custom event to trigger filter changes
    if (section) {
      window.dispatchEvent(new CustomEvent('nav-filter', { detail: { section } }));
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-hero">
              <span className="text-lg font-bold text-primary-foreground">M</span>
            </div>
            <span className="text-xl font-bold text-foreground">
              Marketplace
            </span>
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-6">
          <button 
            onClick={() => scrollToProducts()}
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Browse
          </button>
          <button 
            onClick={() => scrollToProducts('categories')}
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Categories
          </button>
          <button 
            onClick={() => scrollToProducts('deals')}
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Deals
          </button>
          <Link to="/seller" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Sell
          </Link>
          {isAdmin && (
            <Link to="/admin" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-1">
              <Shield className="h-4 w-4" />
              Admin
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {/* Compare button */}
          <Button
            variant="secondary"
            size="icon"
            className="relative"
            onClick={() => setIsCompareOpen(true)}
          >
            <Scale className="h-5 w-5" />
            {compareItems.length > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {compareItems.length}
              </span>
            )}
          </Button>

          {/* Wishlist button */}
          <Button
            variant="secondary"
            size="icon"
            className="relative"
            onClick={() => navigate("/wishlist")}
          >
            <Heart className="h-5 w-5" />
            {wishlistIds.size > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs font-bold text-destructive-foreground">
                {wishlistIds.size}
              </span>
            )}
          </Button>

          {/* Cart button */}
          <Button
            variant="secondary"
            size="icon"
            className="relative"
            onClick={() => setIsCartOpen(true)}
          >
            <ShoppingCart className="h-5 w-5" />
            {totalItems > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
                {totalItems}
              </span>
            )}
          </Button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="icon">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium text-foreground truncate">
                    {profile?.full_name || user.email}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user.email}
                  </p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/profile")}>
                  <User className="h-4 w-4 mr-2" />
                  My Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/wishlist")}>
                  <Heart className="h-4 w-4 mr-2" />
                  My Wishlist
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/seller")}>
                  <Store className="h-4 w-4 mr-2" />
                  Seller Dashboard
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem onClick={() => navigate("/admin")}>
                    <Shield className="h-4 w-4 mr-2" />
                    Admin Dashboard
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="secondary" onClick={() => navigate("/auth")}>
              Sign In
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
