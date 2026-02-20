import { ArrowRight, Sparkles } from "lucide-react";
import logoImg from "@/assets/logo.png";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export function Hero() {
  const scrollToProducts = () => {
    const productsSection = document.getElementById("products-section");
    if (productsSection) {
      productsSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative overflow-hidden py-10 sm:py-14 md:py-20 lg:py-24">
      <div className="absolute inset-0 gradient-hero opacity-5" />
      <div className="absolute top-10 left-4 sm:top-20 sm:left-10 h-40 w-40 sm:h-72 sm:w-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute bottom-6 right-4 sm:bottom-10 sm:right-10 h-48 w-48 sm:h-96 sm:w-96 rounded-full bg-accent/10 blur-3xl" />
      
      <div className="container relative mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <button 
            onClick={scrollToProducts}
            className="mb-4 sm:mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-primary hover:bg-primary/20 transition-colors cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            Discover Amazing Deals
          </button>
          
          <h1 className="mb-4 sm:mb-6 text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight text-foreground leading-tight">
            Your Local{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Marketplace
            </span>
          </h1>
          
          <p className="mb-6 sm:mb-8 text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground px-2 sm:px-0">
            Buy and sell amazing products from trusted sellers in your community. 
            Find everything you need, from electronics to home goods.
          </p>
          
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Button variant="hero" size="xl" onClick={scrollToProducts} className="w-full sm:w-auto text-sm sm:text-base">
              Start Shopping
              <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            <Button variant="outline" size="xl" asChild className="w-full sm:w-auto text-sm sm:text-base">
              <Link to="/become-seller">
                Become a Seller
              </Link>
            </Button>
          </div>
          
          <div className="mt-8 sm:mt-12 flex items-center justify-center gap-4 sm:gap-8 text-xs sm:text-sm text-muted-foreground flex-wrap">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-primary" />
              <span>10K+ Products</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-accent" />
              <span>5K+ Sellers</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-primary" />
              <span>Secure Payments</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
