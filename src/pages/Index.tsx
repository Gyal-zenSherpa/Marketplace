import { Helmet } from "react-helmet-async";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { ProductGrid } from "@/components/ProductGrid";
import { CartSidebar } from "@/components/CartSidebar";
import { Footer } from "@/components/Footer";
import { ProductRecommendations } from "@/components/ProductRecommendations";
import { ChatAssistant } from "@/components/ChatAssistant";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Marketplace - Buy & Sell Locally</title>
        <meta name="description" content="Your local marketplace to buy and sell amazing products from trusted sellers in your community. Browse 10K+ products across electronics, fashion, home goods & more with secure payments." />
        <meta property="og:title" content="Marketplace - Buy & Sell Locally" />
        <meta property="og:description" content="Discover amazing deals from trusted local sellers. Electronics, fashion, home goods & more with secure payments." />
        <meta property="og:image" content="/logo.png" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Marketplace - Buy & Sell Locally" />
        <meta name="twitter:description" content="Discover amazing deals from trusted local sellers. Electronics, fashion, home goods & more." />
        <meta name="twitter:image" content="/logo.png" />
      </Helmet>
      <Header />
      <main>
        <Hero />
        <ProductRecommendations />
        <ProductGrid />
      </main>
      <CartSidebar />
      <ChatAssistant />
      <Footer />
    </div>
  );
};

export default Index;
