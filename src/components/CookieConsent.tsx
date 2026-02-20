import { useState, useEffect } from "react";
import { Cookie, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookie-consent", "accepted");
    setVisible(false);
  };

  const handleReject = () => {
    localStorage.setItem("cookie-consent", "rejected");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 md:p-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="mx-auto max-w-4xl rounded-2xl border border-border bg-background/95 backdrop-blur-md shadow-2xl p-4 md:p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          {/* Icon */}
          <div className="flex-shrink-0 flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Cookie className="h-5 w-5 md:h-6 md:w-6" />
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm md:text-base font-semibold text-foreground mb-1">
              We use cookies to enhance your experience 🍪
            </h3>
            <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
              We use cookies and similar technologies to analyze your browsing behavior, understand your intentions, and personalize your shopping experience. This helps us show you the most relevant products and improve our services.{" "}
              <Link
                to="/cookie-policy"
                onClick={() => setVisible(false)}
                className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
              >
                Learn more
              </Link>
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0 w-full md:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReject}
              className="flex-1 md:flex-none gap-1.5 text-xs md:text-sm border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <X className="h-3.5 w-3.5" />
              Reject
            </Button>
            <Button
              size="sm"
              onClick={handleAccept}
              className="flex-1 md:flex-none gap-1.5 text-xs md:text-sm"
            >
              <Check className="h-3.5 w-3.5" />
              Accept All
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
