import { ShieldCheck, Truck, CreditCard, HeadphonesIcon, Star, Gift } from "lucide-react";

const features = [
  {
    icon: ShieldCheck,
    title: "Verified Sellers",
    description: "Every seller is verified with identity checks. Shop with confidence knowing you're buying from trusted local businesses.",
  },
  {
    icon: Truck,
    title: "Fast Delivery",
    description: "2-5 days in Kathmandu Valley, 5-10 days nationwide. Free delivery on orders above Rs. 1,500.",
  },
  {
    icon: CreditCard,
    title: "Secure Payments",
    description: "Pay with eSewa, Khalti, ConnectIPS, bank transfer, or cash on delivery. All transactions are encrypted.",
  },
  {
    icon: Star,
    title: "Quality Products",
    description: "Browse 10,000+ quality products across electronics, fashion, home goods, beauty, and more.",
  },
  {
    icon: Gift,
    title: "Loyalty Rewards",
    description: "Earn points on every purchase. Redeem for discounts, free shipping, and exclusive deals.",
  },
  {
    icon: HeadphonesIcon,
    title: "Customer Support",
    description: "Dedicated support team available Sunday to Friday. Get help via phone, email, or WhatsApp.",
  },
];

export function WhyChooseUs() {
  return (
    <section className="py-12 md:py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
            Why Shop With Us?
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm md:text-base">
            Marketplace Nepal brings together trusted sellers and quality products with the shopping experience you deserve.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="bg-card border border-border rounded-xl p-5 md:p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="bg-primary/10 p-3 rounded-lg w-fit mb-4">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
