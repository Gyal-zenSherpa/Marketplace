import { Helmet } from "react-helmet-async";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { ProductGrid } from "@/components/ProductGrid";
import { CartSidebar } from "@/components/CartSidebar";
import { Footer } from "@/components/Footer";
import { ProductRecommendations } from "@/components/ProductRecommendations";
import { ChatAssistant } from "@/components/ChatAssistant";
import { AdBanner } from "@/components/AdBanner";
import { WhyChooseUs } from "@/components/WhyChooseUs";
import { HomepageContent } from "@/components/HomepageContent";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Marketplace Nepal",
  "url": "https://marketplace-gzn.lovable.app",
  "description": "Your local marketplace to buy and sell amazing products from trusted sellers in Nepal.",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://marketplace-gzn.lovable.app/?search={search_term_string}",
    "query-input": "required name=search_term_string"
  }
};

const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Marketplace Nepal Pvt. Ltd.",
  "url": "https://marketplace-gzn.lovable.app",
  "logo": "https://marketplace-gzn.lovable.app/logo.png",
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+977-9763689295",
    "contactType": "customer service",
    "availableLanguage": ["English", "Nepali"]
  },
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "New Road",
    "addressLocality": "Kathmandu",
    "addressCountry": "NP"
  },
  "sameAs": [
    "https://www.facebook.com/swift.gyalzensherpa",
    "https://www.instagram.com/its_gyal_zeen/"
  ]
};

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Marketplace Nepal - Buy & Sell Quality Products from Trusted Local Sellers</title>
        <meta name="description" content="Nepal's trusted online marketplace with 10,000+ products from 5,000+ verified sellers. Shop electronics, fashion, home goods & more with secure payments, loyalty rewards, and fast delivery across 75+ cities." />
        <meta property="og:title" content="Marketplace Nepal - Buy & Sell Quality Products Locally" />
        <meta property="og:description" content="Discover amazing deals from verified local sellers. Electronics, fashion, home goods & more with secure payments and nationwide delivery." />
        <meta property="og:image" content="/logo.png" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://marketplace-gzn.lovable.app" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Marketplace Nepal - Buy & Sell Quality Products Locally" />
        <meta name="twitter:description" content="Nepal's trusted marketplace with 10K+ products. Secure payments, fast delivery, loyalty rewards." />
        <meta name="twitter:image" content="/logo.png" />
        <link rel="canonical" href="https://marketplace-gzn.lovable.app" />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(orgJsonLd)}</script>
      </Helmet>
      <Header />
      <main>
        <Hero />
        <AdBanner position="below-hero" />
        <ProductRecommendations />
        <AdBanner position="homepage" />
        <ProductGrid />
        <WhyChooseUs />
        <HomepageContent />
      </main>
      <CartSidebar />
      <ChatAssistant />
      <Footer />
    </div>
  );
};

export default Index;

