import { Link } from "react-router-dom";
import { ShoppingBag, TrendingUp, BookOpen, Shield, ArrowRight, MapPin, Smartphone, CreditCard, Truck, Users, Star, HelpCircle } from "lucide-react";

const guides = [
  {
    icon: Smartphone,
    title: "Electronics Buying Guide",
    description: "How to choose genuine electronics in Nepal — from checking warranties to verifying authorized dealers. Avoid counterfeits and get the best value.",
    link: "/blog/how-to-spot-genuine-products-online",
  },
  {
    icon: ShoppingBag,
    title: "Fashion & Clothing Tips",
    description: "Understanding Nepali sizing, fabric quality, and seasonal trends. Our guide helps you shop confidently for traditional and modern apparel.",
    link: "/blog/top-10-must-have-gadgets-for-nepali-households",
  },
  {
    icon: CreditCard,
    title: "Safe Online Payments",
    description: "A complete guide to using eSewa, Khalti, ConnectIPS, and bank transfers securely. Learn how to protect your financial information while shopping online.",
    link: "/blog/digital-payments-in-nepal-complete-guide",
  },
];

const stats = [
  { value: "10,000+", label: "Products Listed", icon: ShoppingBag },
  { value: "5,000+", label: "Verified Sellers", icon: Users },
  { value: "75+", label: "Cities Served", icon: MapPin },
  { value: "4.8★", label: "Average Rating", icon: Star },
];

const faqs = [
  {
    q: "How does Marketplace Nepal ensure product quality?",
    a: "Every seller undergoes identity verification before listing products. Customer reviews and our quality control team help maintain high standards across the platform.",
  },
  {
    q: "What payment methods are available?",
    a: "We accept eSewa, Khalti, IME Pay, ConnectIPS, bank transfers, Visa/Mastercard, and Cash on Delivery across Nepal.",
  },
  {
    q: "How long does delivery take?",
    a: "Orders within Kathmandu Valley typically arrive in 2-5 business days. Nationwide delivery takes 5-10 business days depending on the district.",
  },
  {
    q: "Is there a return or refund policy?",
    a: "We operate a no cash refund policy. However, store credit is available for our shipping errors, manufacturing defects, or damaged items reported within 48 hours.",
  },
  {
    q: "How do I become a seller on Marketplace Nepal?",
    a: "Click 'Become a Seller' and submit your application with business details and ID verification. Our team reviews applications within 2-3 business days.",
  },
  {
    q: "What is the Loyalty Rewards program?",
    a: "Earn points on every purchase. Accumulate points to unlock discounts, free shipping, and exclusive member-only deals. Points never expire.",
  },
];

export function HomepageContent() {
  return (
    <>
      {/* Shopping Guides Section */}
      <section className="py-12 md:py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mb-3">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
              Shopping Guides & Resources
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm md:text-base">
              Make informed purchasing decisions with our expert guides tailored for Nepali consumers. 
              From spotting counterfeit products to understanding digital payment security, we've got you covered.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {guides.map((guide) => {
              const Icon = guide.icon;
              return (
                <Link
                  key={guide.title}
                  to={guide.link}
                  className="group bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="bg-primary/10 p-3 rounded-lg w-fit mb-4 group-hover:bg-primary/20 transition-colors">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                    {guide.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    {guide.description}
                  </p>
                  <span className="text-sm text-primary flex items-center gap-1 group-hover:gap-2 transition-all">
                    Read Guide <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </Link>
              );
            })}
          </div>

          <div className="text-center">
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 text-primary hover:underline font-medium text-sm"
            >
              Browse All Articles ({22} posts) <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Trust & Stats Section */}
      <section className="py-12 md:py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mb-3">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
              Trusted by Thousands Across Nepal
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm md:text-base">
              Since our founding in 2024, Marketplace Nepal has grown into a vibrant community of buyers and sellers 
              spanning every district in the country. Our commitment to verified sellers, secure payments, and reliable 
              delivery has earned the trust of thousands of Nepali consumers.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-10">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="bg-card border border-border rounded-xl p-5 text-center shadow-sm">
                  <Icon className="h-5 w-5 text-primary mx-auto mb-2" />
                  <p className="text-2xl md:text-3xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs md:text-sm text-muted-foreground mt-1">{stat.label}</p>
                </div>
              );
            })}
          </div>

          <div className="bg-card border border-border rounded-xl p-6 md:p-8 max-w-3xl mx-auto">
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 p-3 rounded-lg shrink-0">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Our Commitment to You</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Every seller on Marketplace Nepal is verified through a rigorous application process that includes 
                  identity verification, business documentation review, and ongoing quality monitoring. Our platform 
                  uses SSL encryption for all transactions, and we partner with trusted payment gateways including 
                  eSewa, Khalti, and ConnectIPS to keep your financial information secure. If something goes wrong 
                  with your order due to our error, our store credit policy ensures you're covered.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12 md:py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
              How Marketplace Nepal Works
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm md:text-base">
              Shopping on our platform is simple, secure, and designed for the Nepali market.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {[
              {
                step: "1",
                icon: ShoppingBag,
                title: "Browse & Discover",
                desc: "Explore thousands of products across categories. Use search, filters, and AI-powered recommendations to find what you need.",
              },
              {
                step: "2",
                icon: CreditCard,
                title: "Pay Securely",
                desc: "Choose from eSewa, Khalti, bank transfer, card payment, or cash on delivery. All digital payments are encrypted.",
              },
              {
                step: "3",
                icon: Truck,
                title: "Fast Delivery",
                desc: "Orders ship within 24 hours. Track your package in real time. Free delivery on orders above Rs. 1,500 within the Valley.",
              },
              {
                step: "4",
                icon: Star,
                title: "Rate & Earn",
                desc: "Leave reviews to help other shoppers. Earn loyalty points on every purchase that you can redeem for discounts.",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.step} className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-primary text-primary-foreground rounded-full text-lg font-bold mb-4">
                    {item.step}
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-12 md:py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mb-3">
              <HelpCircle className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
              Frequently Asked Questions
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm md:text-base">
              Find answers to common questions about shopping, payments, delivery, and more on Marketplace Nepal.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-5">
                <h3 className="font-semibold text-foreground mb-2 text-sm">{faq.q}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <p className="text-sm text-muted-foreground mb-3">
              Still have questions? We're here to help.
            </p>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Contact Support <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
