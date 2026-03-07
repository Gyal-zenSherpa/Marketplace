import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ArrowLeft, ShieldCheck, Truck, Users, Star, Heart, Globe, Award, CheckCircle } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const stats = [
  { label: "Products Listed", value: "10,000+", icon: Star },
  { label: "Trusted Sellers", value: "5,000+", icon: Users },
  { label: "Happy Customers", value: "50,000+", icon: Heart },
  { label: "Cities Served", value: "75+", icon: Globe },
];

const values = [
  {
    icon: ShieldCheck,
    title: "Trust & Authenticity",
    description: "Every seller on our platform undergoes verification. We ensure that products listed are genuine, and transactions are secure with end-to-end encrypted payments."
  },
  {
    icon: Users,
    title: "Community First",
    description: "We believe in empowering local entrepreneurs and small businesses. Our marketplace connects buyers directly with trusted sellers in their community, fostering economic growth."
  },
  {
    icon: Truck,
    title: "Reliable Delivery",
    description: "From Kathmandu Valley to remote hill districts, we partner with Nepal's leading logistics providers to ensure your orders reach you safely and on time."
  },
  {
    icon: Award,
    title: "Quality Assurance",
    description: "Our quality control team reviews product listings to maintain high standards. Customer reviews and ratings help you make informed purchasing decisions."
  },
];

const timeline = [
  { year: "2024", event: "Founded with a mission to digitize local commerce in Nepal" },
  { year: "2024", event: "Launched with 500+ products from 100 verified sellers" },
  { year: "2025", event: "Expanded to all 77 districts across Nepal" },
  { year: "2025", event: "Introduced loyalty rewards program for repeat customers" },
  { year: "2026", event: "Reached 10,000+ products and 5,000+ active sellers" },
];

export default function About() {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>About Marketplace - Our Story & Mission</title>
        <meta name="description" content="Learn about Marketplace Nepal - your trusted local online marketplace connecting buyers with verified sellers across 75+ cities. Discover our mission, values, and commitment to quality." />
      </Helmet>
      <Header />

      <main className="container mx-auto px-4 py-8">
        <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-primary mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Link>

        {/* Hero */}
        <section className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
            <Globe className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            About <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Marketplace</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-base md:text-lg leading-relaxed">
            We are Nepal's growing online marketplace dedicated to connecting local buyers with trusted sellers. 
            Our platform makes it easy to discover, compare, and purchase quality products — from electronics and fashion 
            to home essentials — all with secure payments and reliable delivery across the country.
          </p>
        </section>

        {/* Stats */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-16">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="bg-card border border-border rounded-xl p-5 text-center shadow-sm">
                <Icon className="h-6 w-6 text-primary mx-auto mb-2" />
                <p className="text-2xl md:text-3xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs md:text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            );
          })}
        </section>

        {/* Our Mission */}
        <section className="bg-muted/50 rounded-2xl p-6 md:p-10 mb-16">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4 text-center">Our Mission</h2>
          <p className="text-muted-foreground text-center max-w-3xl mx-auto text-sm md:text-base leading-relaxed">
            To democratize e-commerce in Nepal by providing a safe, user-friendly platform where anyone can buy and sell 
            quality products. We aim to bridge the gap between local sellers and digital-savvy buyers, making commerce 
            accessible to every corner of the country. By leveraging technology and building trust, we empower small 
            businesses and entrepreneurs to reach customers they never could before.
          </p>
        </section>

        {/* Our Values */}
        <section className="mb-16">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8 text-center">Our Core Values</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {values.map((value) => {
              const Icon = value.icon;
              return (
                <div key={value.title} className="bg-card border border-border rounded-xl p-6 shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="bg-primary/10 p-3 rounded-lg shrink-0">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">{value.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{value.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* How It Works */}
        <section className="mb-16">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8 text-center">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { step: "1", title: "Browse & Discover", desc: "Explore thousands of products across categories like electronics, fashion, home goods, beauty, and more. Use filters and search to find exactly what you need." },
              { step: "2", title: "Order Securely", desc: "Add items to your cart, choose your preferred payment method — digital wallets, bank transfer, or cash on delivery — and place your order with confidence." },
              { step: "3", title: "Receive & Enjoy", desc: "Track your order in real-time. We deliver across Nepal — 2-5 days in Kathmandu Valley and 5-10 days nationwide. Inspect on delivery for peace of mind." },
            ].map((item) => (
              <div key={item.step} className="text-center bg-card border border-border rounded-xl p-6 shadow-sm">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-primary text-primary-foreground rounded-full text-xl font-bold mb-4">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Timeline */}
        <section className="mb-16">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8 text-center">Our Journey</h2>
          <div className="max-w-2xl mx-auto space-y-4">
            {timeline.map((item, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="bg-primary/10 text-primary font-bold text-sm px-3 py-1 rounded-full shrink-0 mt-0.5">
                  {item.year}
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-primary shrink-0 mt-1" />
                  <p className="text-sm text-muted-foreground">{item.event}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="bg-primary text-primary-foreground rounded-2xl p-6 md:p-10 mb-16">
          <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center">Why Choose Marketplace?</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {[
              "Verified sellers with identity checks",
              "Secure payment processing",
              "Free delivery on orders above Rs. 1,500",
              "Real customer reviews and ratings",
              "Loyalty rewards on every purchase",
              "Dedicated customer support team",
              "Easy product comparison tools",
              "Nationwide delivery to 75+ cities",
              "AI-powered product recommendations",
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 shrink-0 opacity-80" />
                <span className="text-sm opacity-90">{item}</span>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="text-center mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-3">Ready to Get Started?</h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Join thousands of happy customers and sellers on Nepal's fastest-growing marketplace.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/" className="inline-flex items-center justify-center bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors">
              Start Shopping
            </Link>
            <Link to="/become-seller" className="inline-flex items-center justify-center border border-border text-foreground px-6 py-3 rounded-lg font-semibold hover:bg-muted transition-colors">
              Become a Seller
            </Link>
          </div>
        </section>

        {/* Footer info */}
        <div className="text-center text-muted-foreground text-sm space-y-1 border-t pt-6">
          <p className="font-medium text-foreground">Marketplace Nepal Pvt. Ltd.</p>
          <p>New Road, Kathmandu, Nepal</p>
          <p className="text-xs">Registration No.: 21345698 | PAN No.: 5115274</p>
          <p className="text-xs">© 2024-2026 Marketplace. All Rights Reserved.</p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
