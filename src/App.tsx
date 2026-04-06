import { lazy, Suspense } from "react";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { CookieConsent } from "@/components/CookieConsent";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import { WishlistProvider } from "@/context/WishlistContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Lazy-loaded routes for better performance
const Auth = lazy(() => import("./pages/Auth"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Checkout = lazy(() => import("./pages/Checkout"));
const SellerDashboard = lazy(() => import("./pages/SellerDashboard"));
const SellerApplication = lazy(() => import("./pages/SellerApplication"));
const Admin = lazy(() => import("./pages/Admin"));
const Wishlist = lazy(() => import("./pages/Wishlist"));
const Profile = lazy(() => import("./pages/Profile"));
const Orders = lazy(() => import("./pages/Orders"));
const Loyalty = lazy(() => import("./pages/Loyalty"));
const TermsAndConditions = lazy(() => import("./pages/TermsAndConditions"));
const RefundPolicy = lazy(() => import("./pages/RefundPolicy"));
const CookiePolicy = lazy(() => import("./pages/CookiePolicy"));
const Contact = lazy(() => import("./pages/Contact"));
const About = lazy(() => import("./pages/About"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const ReportIssue = lazy(() => import("./pages/ReportIssue"));
const Disclaimer = lazy(() => import("./pages/Disclaimer"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="flex min-h-screen items-center justify-center bg-background">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
);

const App = () => {
  return (
    <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <TooltipProvider>
          <AuthProvider>
            <CartProvider>
              <WishlistProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <CookieConsent />
                  <Suspense fallback={<PageLoader />}>
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/auth" element={<Auth />} />
                      <Route path="/admin-login" element={<AdminLogin />} />
                      <Route path="/product/:id" element={<ProductDetail />} />
                      <Route path="/checkout" element={<Checkout />} />
                      <Route path="/seller" element={<SellerDashboard />} />
                      <Route path="/become-seller" element={<SellerApplication />} />
                      <Route path="/admin" element={<Admin />} />
                      <Route path="/wishlist" element={<Wishlist />} />
                      <Route path="/profile" element={<Profile />} />
                      <Route path="/orders" element={<Orders />} />
                      <Route path="/loyalty" element={<Loyalty />} />
                      <Route path="/terms" element={<TermsAndConditions />} />
                      <Route path="/refund-policy" element={<RefundPolicy />} />
                      <Route path="/cookie-policy" element={<CookiePolicy />} />
                      <Route path="/contact" element={<Contact />} />
                      <Route path="/about" element={<About />} />
                      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                      <Route path="/report-issue" element={<ReportIssue />} />
                      <Route path="/disclaimer" element={<Disclaimer />} />
                      <Route path="/blog" element={<Blog />} />
                      <Route path="/blog/:slug" element={<BlogPost />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                </BrowserRouter>
              </WishlistProvider>
            </CartProvider>
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
    </HelmetProvider>
  );
};

export default App;
