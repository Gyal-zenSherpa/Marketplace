import { useState, useEffect } from "react";
import { ShoppingCart, Menu, User, LogOut, Store, Shield, Heart, Package, BarChart3 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useWishlistContext } from "@/context/WishlistContext";
import { LoyaltyWidget } from "@/components/loyalty/LoyaltyWidget";
import { ThemeToggle } from "@/components/ThemeToggle";
import { supabase } from "@/integrations/supabase/client";

export function Header() {
  const { totalItems, setIsCartOpen } = useCart();
  const { user, profile, signOut } = useAuth();
  const { wishlistIds } = useWishlistContext();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    setMobileMenuOpen(false);
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

  const handleNavigation = (path: string) => {
    setMobileMenuOpen(false);
    navigate(path);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-14 md:h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2 md:gap-4">
          {/* Mobile Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] sm:w-[320px]">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-hero">
                    <span className="text-base font-bold text-primary-foreground">M</span>
                  </div>
                  <span className="text-lg font-bold">Marketplace</span>
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 mt-6">
                <button 
                  onClick={() => scrollToProducts()}
                  className="w-full text-left px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted rounded-md transition-colors"
                >
                  Browse Products
                </button>
                <button 
                  onClick={() => scrollToProducts('categories')}
                  className="w-full text-left px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted rounded-md transition-colors"
                >
                  Categories
                </button>
                <button 
                  onClick={() => scrollToProducts('deals')}
                  className="w-full text-left px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted rounded-md transition-colors"
                >
                  Today's Deals
                </button>
                <button
                  onClick={() => handleNavigation('/seller')}
                  className="w-full text-left px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted rounded-md transition-colors"
                >
                  Sell on Marketplace
                </button>
                {isAdmin && (
                  <button
                    onClick={() => handleNavigation('/admin')}
                    className="w-full text-left px-3 py-2.5 text-sm font-medium text-primary hover:bg-muted rounded-md transition-colors flex items-center gap-2"
                  >
                    <Shield className="h-4 w-4" />
                    Admin Dashboard
                  </button>
                )}
                <div className="border-t my-2" />
                <button
                  onClick={() => handleNavigation('/terms')}
                  className="w-full text-left px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                >
                  Terms & Conditions
                </button>
                <button
                  onClick={() => handleNavigation('/refund-policy')}
                  className="w-full text-left px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                >
                  Refund Policy
                </button>
              </nav>
            </SheetContent>
          </Sheet>

          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-lg gradient-hero">
              <span className="text-base md:text-lg font-bold text-primary-foreground">M</span>
            </div>
            <span className="text-lg md:text-xl font-bold text-foreground hidden sm:block">
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

        <div className="flex items-center gap-1.5 md:gap-3">
          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Loyalty Points Widget - hidden on mobile */}
          {user && <div className="hidden sm:block"><LoyaltyWidget /></div>}

          {/* Wishlist button */}
          <Button
            variant="secondary"
            size="icon"
            className="relative h-9 w-9"
            onClick={() => navigate("/wishlist")}
          >
            <Heart className="h-4 w-4 md:h-5 md:w-5" />
            {wishlistIds.size > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 md:h-5 md:w-5 items-center justify-center rounded-full bg-destructive text-[10px] md:text-xs font-bold text-destructive-foreground">
                {wishlistIds.size}
              </span>
            )}
          </Button>

          {/* Cart button */}
          <Button
            variant="secondary"
            size="icon"
            className="relative h-9 w-9"
            onClick={() => setIsCartOpen(true)}
          >
            <ShoppingCart className="h-4 w-4 md:h-5 md:w-5" />
            {totalItems > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 md:h-5 md:w-5 items-center justify-center rounded-full bg-accent text-[10px] md:text-xs font-bold text-accent-foreground">
                {totalItems}
              </span>
            )}
          </Button>

        {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="icon" className="overflow-hidden h-9 w-9">
                  {profile?.avatar_url ? (
                    <img 
                      src={profile.avatar_url} 
                      alt="Profile" 
                      className="h-full w-full object-cover rounded-md"
                    />
                  ) : (
                    <User className="h-4 w-4 md:h-5 md:w-5" />
                  )}
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
                <DropdownMenuItem onClick={() => navigate("/orders")}>
                  <Package className="h-4 w-4 mr-2" />
                  My Orders
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
                  <>
                    <DropdownMenuItem onClick={() => navigate("/admin")}>
                      <Shield className="h-4 w-4 mr-2" />
                      Admin Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/admin?tab=analytics")}>
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Analytics
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="secondary" size="sm" className="text-xs md:text-sm px-2 md:px-4" onClick={() => navigate("/auth")}>
              Sign In
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
