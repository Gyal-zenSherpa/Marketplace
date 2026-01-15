import { Facebook, Twitter, Instagram, Mail } from "lucide-react";
import { Link } from "react-router-dom";

export function Footer() {
  const scrollToProducts = () => {
    const productsSection = document.getElementById("products-section");
    if (productsSection) {
      productsSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <footer className="border-t border-border bg-secondary/30">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid gap-6 md:gap-8 grid-cols-2 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-lg gradient-hero">
                <span className="text-base md:text-lg font-bold text-primary-foreground">M</span>
              </div>
              <span className="text-lg md:text-xl font-bold text-foreground">Marketplace</span>
            </div>
            <p className="mb-4 text-xs md:text-sm text-muted-foreground">
              Your trusted local marketplace for buying and selling quality products.
            </p>
            <div className="flex gap-2 md:gap-3">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-full bg-secondary hover:bg-primary hover:text-primary-foreground transition-colors">
                <Facebook className="h-3.5 w-3.5 md:h-4 md:w-4" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-full bg-secondary hover:bg-primary hover:text-primary-foreground transition-colors">
                <Twitter className="h-3.5 w-3.5 md:h-4 md:w-4" />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-full bg-secondary hover:bg-primary hover:text-primary-foreground transition-colors">
                <Instagram className="h-3.5 w-3.5 md:h-4 md:w-4" />
              </a>
              <a href="mailto:marketplaceauthentic01@gmail.com" className="flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-full bg-secondary hover:bg-primary hover:text-primary-foreground transition-colors">
                <Mail className="h-3.5 w-3.5 md:h-4 md:w-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="mb-3 md:mb-4 font-semibold text-foreground text-sm md:text-base">Quick Links</h4>
            <ul className="space-y-1.5 md:space-y-2 text-xs md:text-sm">
              <li>
                <button onClick={scrollToProducts} className="text-muted-foreground hover:text-primary transition-colors">
                  Browse Products
                </button>
              </li>
              <li>
                <button onClick={scrollToProducts} className="text-muted-foreground hover:text-primary transition-colors">
                  Categories
                </button>
              </li>
              <li>
                <button onClick={scrollToProducts} className="text-muted-foreground hover:text-primary transition-colors">
                  Today's Deals
                </button>
              </li>
              <li>
                <Link to="/become-seller" className="text-muted-foreground hover:text-primary transition-colors">
                  Sell on Marketplace
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="mb-3 md:mb-4 font-semibold text-foreground text-sm md:text-base">Support</h4>
            <ul className="space-y-1.5 md:space-y-2 text-xs md:text-sm">
              <li>
                <Link to="/terms" className="text-muted-foreground hover:text-primary transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-muted-foreground hover:text-primary transition-colors">
                  Safety Tips
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-muted-foreground hover:text-primary transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/report-issue" className="text-muted-foreground hover:text-primary transition-colors">
                  Report an Issue
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="mb-3 md:mb-4 font-semibold text-foreground text-sm md:text-base">Legal</h4>
            <ul className="space-y-1.5 md:space-y-2 text-xs md:text-sm">
              <li>
                <Link to="/terms" className="text-muted-foreground hover:text-primary transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-muted-foreground hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/cookie-policy" className="text-muted-foreground hover:text-primary transition-colors">
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link to="/refund-policy" className="text-muted-foreground hover:text-primary transition-colors">
                  Refund Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-6 md:mt-8 border-t border-border pt-6 md:pt-8 text-center text-xs md:text-sm text-muted-foreground">
          <p>&copy; 2024 Marketplace. All rights reserved.</p>
          <p className="mt-2 md:mt-3 flex items-center justify-center gap-2">
            Made by <span className="font-semibold text-foreground">Gyal-Zeen Sherpa</span>
            <img 
              src="https://flagcdn.com/w40/np.png" 
              alt="Nepal Flag" 
              className="h-3 md:h-4 w-auto inline-block"
            />
          </p>
        </div>
      </div>
    </footer>
  );
}
