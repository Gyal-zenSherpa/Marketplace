import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  ChevronDown, 
  ChevronUp, 
  AlertCircle, 
  Scale, 
  Shield, 
  FileText, 
  Mail, 
  Phone, 
  MapPin,
  CreditCard,
  Truck,
  Gift,
  Star,
  Lock,
  Ban,
  AlertTriangle,
  Cloud,
  Edit,
  Users,
  Percent,
  Gavel
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { cn } from "@/lib/utils";

const sections = [
  {
    id: 1,
    title: "Introduction and Acceptance of Terms",
    icon: FileText,
    content: `Welcome to Marketplace. These Terms and Conditions govern your access to and use of our website, mobile application, and services.

By accessing or using our Platform, placing an order, or purchasing any products from Marketplace, you agree to be bound by these Terms and Conditions. If you do not agree with any part of these Terms, you must not use our Platform or make any purchases.`
  },
  {
    id: 2,
    title: "Eligibility and Account Registration",
    icon: Shield,
    content: `Age Requirement: You must be at least 18 years old to make purchases on our Platform.

Account Creation:
• You are responsible for maintaining the confidentiality of your account credentials
• You must provide accurate, current, and complete information
• You are responsible for all activities that occur under your account
• Notify us immediately of any unauthorized use

Account Termination: We reserve the right to suspend or terminate your account if you violate these Terms, engage in fraudulent activity, or abuse our policies.`
  },
  {
    id: 3,
    title: "Products and Pricing",
    icon: CreditCard,
    content: `Product Information:
• We strive to display product colors, images, and descriptions accurately
• Actual product colors may vary slightly due to screen settings
• Product availability is subject to change without notice

Pricing:
• All prices are in Nepali Rupees (NPR)
• Prices are subject to change without prior notice
• The price at order placement applies
• We reserve the right to correct pricing errors
• Delivery charges may apply and will be shown before checkout`
  },
  {
    id: 4,
    title: "Ordering and Payment",
    icon: CreditCard,
    content: `Order Placement:
• Review your order carefully before confirming purchase
• Once confirmed and payment processed, orders cannot be cancelled or modified
• We reserve the right to refuse or cancel any order at our discretion

Payment Methods:
• Digital Wallets: eSewa, Khalti/IME Pay, PrabhuPay
• Bank Transfer: ConnectIPS, NEFT, RTGS
• Cards: Visa, Mastercard, UnionPay
• Cash on Delivery (where available)

Payment Terms:
• Full payment required at order placement (except COD)
• All payments processed securely through authorized gateways
• You authorize us to charge the payment method provided`
  },
  {
    id: 5,
    title: "Shipping and Delivery",
    icon: Truck,
    content: `Delivery Locations:
• Kathmandu Valley: Kathmandu, Lalitpur, Bhaktapur
• Outside Valley: All districts across Nepal

Delivery Timeline:
• Inside Kathmandu Valley: 2-5 business days
• Outside Kathmandu Valley: 5-10 business days
• Times are estimates and not guaranteed

Delivery Charges:
• Free delivery on orders above Rs. 1,500 within Kathmandu Valley
• Charges vary by location (shown at checkout)

Delivery Process:
• Provide accurate delivery address and contact information
• You or authorized recipient must be available
• Inspect packages upon delivery before signing
• Note any visible damage on delivery receipt

Failed Delivery: If delivery fails due to incorrect address, unavailability, or refusal, we may charge re-delivery fees or cancel without refund.`
  },
  {
    id: 6,
    title: "No Refund Policy",
    icon: AlertCircle,
    content: `⚠️ ALL SALES ARE FINAL

General Policy:
• NO CASH REFUND, NO RETURN, NO EXCHANGE policy
• Once sold and payment made, sale is final
• ONCE SOLD IS FOREVER SOLD

Store Credit Exception (NOT cash refunds):
We offer STORE CREDIT ONLY in limited situations:
• Our shipping errors (wrong item, size, color sent)
• Manufacturing defects (unworn items, reported within 48 hours)
• Shipping damage (with proof, within 24 hours)
• Non-delivery (after investigation)

Store Credit Terms:
• Equals 100% of purchase price
• No expiration date
• Non-transferable, cannot be redeemed for cash

No Refunds For:
• Customer ordering errors
• Change of mind
• Items that don't fit
• Worn, washed, or used items
• Items without tags
• Items reported after 48 hours

For complete details, see our separate Refund Policy.`
  },
  {
    id: 7,
    title: "Product Inspection and Complaints",
    icon: FileText,
    content: `Inspection Upon Delivery:
• Inspect all products immediately upon delivery
• Check for defects, damage, or incorrect items
• Report issues within 24-48 hours of delivery
• Take photos/videos as evidence

How to Report Issues:
• Email: marketplaceauthentic01@gmail.com
• Phone: 01-XXXXXXX
• WhatsApp: 98XXXXXXXX
• Provide order number, photos, and detailed description

Investigation:
• We evaluate all complaints fairly
• Additional information may be requested
• Decision communicated within 48 hours
• Our decision is final and binding`
  },
  {
    id: 8,
    title: "Intellectual Property Rights",
    icon: Scale,
    content: `Our Content:
All content on our Platform including logo, brand name, trademarks, website design, product images, text, graphics, and software are owned by or licensed to Marketplace.

Restrictions - You may not:
• Copy, reproduce, or distribute our content
• Modify or create derivative works
• Use our content for commercial purposes
• Remove copyright or trademark notices
• Use our brand name or logo without permission

User Content:
If you submit content (reviews, photos, comments):
• You grant us a license to use it
• You confirm you own the rights
• We may use it for marketing
• We may remove inappropriate content`
  },
  {
    id: 9,
    title: "Prohibited Uses",
    icon: Ban,
    content: `You agree not to:
• Use the Platform for any illegal purpose
• Violate any laws or regulations
• Infringe on intellectual property rights
• Transmit viruses or malicious code
• Attempt to hack or breach security
• Impersonate others or provide false information
• Harass, abuse, or harm others
• Engage in fraudulent activity
• Use automated systems (bots, scrapers)
• Resell products commercially without authorization
• Post false reviews or manipulate ratings

Consequences: Violation may result in account termination, legal action, and liability for damages.`
  },
  {
    id: 10,
    title: "Limitation of Liability",
    icon: AlertTriangle,
    content: `Disclaimer:
• Platform and products provided "AS IS"
• No warranties, express or implied
• No guarantee of uninterrupted or error-free service

We are NOT liable for:
• Indirect, incidental, or consequential damages
• Loss of profits, data, or business opportunities
• Third-party actions or content
• Courier or shipping carrier issues
• Force majeure events

Maximum Liability:
Our total liability shall not exceed the amount you paid for the specific product.

Exceptions:
Nothing limits liability for death/injury caused by negligence, fraud, or liability that cannot be excluded by law.`
  },
  {
    id: 11,
    title: "Privacy and Data Protection",
    icon: Lock,
    content: `Data Collection:
• Personal information (name, address, phone, email)
• Payment information (processed securely)
• Usage data (browsing behavior, preferences)
• Device information

Data Use:
• Process orders and payments
• Communicate with you
• Improve our services
• Send promotional materials (with consent)
• Comply with legal obligations

Your Rights:
• Access your personal data
• Request corrections
• Request deletion
• Opt-out of marketing communications

Data Security:
We implement reasonable security measures, but no system is 100% secure.`
  },
  {
    id: 12,
    title: "User Reviews and Ratings",
    icon: Star,
    content: `Submission:
By submitting reviews:
• You grant us rights to use and publish your review
• You confirm review is honest and based on experience
• You agree not to post false or defamatory content

Moderation:
We reserve the right to:
• Remove or edit reviews
• Reject reviews that violate policies
• Verify authenticity

Prohibited Content:
Reviews must not contain:
• Offensive or discriminatory language
• Personal information of others
• Promotional content or spam
• False or misleading claims`
  },
  {
    id: 13,
    title: "Promotions and Discounts",
    icon: Percent,
    content: `Promotional Offers:
• Subject to specific terms and conditions
• May have expiration dates and usage limits
• We reserve right to modify or cancel
• Cannot be combined unless stated

Coupon Code Use:
• One coupon per order unless specified
• Non-transferable
• No cash value
• We may void fraudulent codes

Sale Items:
• Valid while supplies last
• We reserve right to limit quantities
• Follow same no-refund policy`
  },
  {
    id: 14,
    title: "Gift Cards and Store Credit",
    icon: Gift,
    content: `Gift Cards:
• Non-refundable
• Lost or stolen cards not replaced
• No expiration date
• Cannot be redeemed for cash

Store Credit:
• Issued as per refund policy
• Non-transferable
• No expiration date
• Cannot be redeemed for cash
• Can be used for any purchase`
  },
  {
    id: 15,
    title: "Dispute Resolution",
    icon: Gavel,
    content: `Customer Service First:
Please contact our customer service before legal action.

Governing Law:
These Terms are governed by laws of Nepal. Disputes subject to exclusive jurisdiction of courts in Kathmandu, Nepal.

Arbitration:
Disputes may be resolved through arbitration as per Nepal Arbitration Act, if both parties agree.

Class Action Waiver:
You agree to resolve disputes individually.`
  },
  {
    id: 16,
    title: "Force Majeure",
    icon: Cloud,
    content: `We are not liable for failure to perform due to circumstances beyond reasonable control:
• Natural disasters (earthquakes, floods, landslides)
• Government actions or regulations
• Strikes or labor disputes
• Pandemics or public health emergencies
• War, civil unrest, or terrorism
• Internet or telecommunications failures
• Power outages

During force majeure events, we may suspend services temporarily without liability.`
  },
  {
    id: 17,
    title: "Modification of Terms",
    icon: Edit,
    content: `Right to Modify:
We reserve the right to modify these Terms at any time without prior notice. Changes effective immediately upon posting.

Your Responsibility:
Review Terms periodically. Continued use after changes constitutes acceptance.

Notification:
For significant changes, we may notify you via email, Platform announcement, or pop-up notice.`
  }
];

export default function TermsAndConditions() {
  const navigate = useNavigate();
  const [expandedSections, setExpandedSections] = useState<Record<number, boolean>>({});

  const toggleSection = (sectionId: number) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
              <Scale className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Terms and Conditions</h1>
            <p className="text-muted-foreground">Last Updated: January 5, 2026</p>
          </div>

          {/* Important Notice */}
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-8">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-destructive mb-1">Important Notice</h3>
                <p className="text-sm text-muted-foreground">
                  Please read these Terms and Conditions carefully before using our Platform or making any purchase. 
                  By proceeding, you confirm your acceptance of these Terms.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Summary */}
          <div className="bg-muted/50 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-4">Quick Summary</h2>
            <div className="grid gap-3">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                <span className="text-sm text-muted-foreground">All sales are final - No cash refunds policy</span>
              </div>
              <div className="flex items-center gap-3">
                <Gift className="h-4 w-4 text-primary shrink-0" />
                <span className="text-sm text-muted-foreground">Store credit available for our errors only</span>
              </div>
              <div className="flex items-center gap-3">
                <Users className="h-4 w-4 text-primary shrink-0" />
                <span className="text-sm text-muted-foreground">Must be 18+ years old to purchase</span>
              </div>
              <div className="flex items-center gap-3">
                <Ban className="h-4 w-4 text-destructive shrink-0" />
                <span className="text-sm text-muted-foreground">Orders cannot be cancelled after payment</span>
              </div>
              <div className="flex items-center gap-3">
                <Truck className="h-4 w-4 text-primary shrink-0" />
                <span className="text-sm text-muted-foreground">Delivery: 2-5 days in Valley, 5-10 days outside</span>
              </div>
              <div className="flex items-center gap-3">
                <Gavel className="h-4 w-4 text-primary shrink-0" />
                <span className="text-sm text-muted-foreground">Governed by laws of Nepal</span>
              </div>
            </div>
          </div>

          {/* Expandable Sections */}
          <div className="border rounded-lg divide-y bg-card mb-8">
            {sections.map((section) => {
              const IconComponent = section.icon;
              return (
                <div key={section.id}>
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="w-full px-4 md:px-6 py-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <IconComponent className="h-5 w-5 text-primary shrink-0" />
                      <span className="font-medium text-foreground text-left">
                        {section.id}. {section.title}
                      </span>
                    </div>
                    {expandedSections[section.id] ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground shrink-0" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground shrink-0" />
                    )}
                  </button>
                  
                  <div className={cn(
                    "overflow-hidden transition-all duration-200",
                    expandedSections[section.id] ? "max-h-[2000px]" : "max-h-0"
                  )}>
                    <div className="px-4 md:px-6 pb-4 pt-2">
                      <pre className="whitespace-pre-wrap font-sans text-sm text-muted-foreground leading-relaxed">
                        {section.content}
                      </pre>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Additional Important Sections */}
          <div className="bg-muted/50 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-4">Additional Terms</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-foreground mb-1">18. Indemnification</h3>
                <p className="text-sm text-muted-foreground">
                  You agree to indemnify and hold harmless Marketplace from any claims, damages, losses, and expenses 
                  arising from your violation of these Terms, use of our Platform, or violation of any laws.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-foreground mb-1">19. Severability</h3>
                <p className="text-sm text-muted-foreground">
                  If any provision is found invalid or unenforceable, the remaining provisions remain in full force.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-foreground mb-1">20. Entire Agreement</h3>
                <p className="text-sm text-muted-foreground">
                  These Terms, together with our Refund Policy, Privacy Policy, and Cookie Policy, constitute the 
                  entire agreement between you and Marketplace.
                </p>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="border rounded-lg p-6 mb-8 bg-card">
            <h2 className="text-lg font-semibold text-foreground mb-2">Contact Us</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Questions about these Terms? We're here to help!
            </p>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mb-3">
                  <Phone className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-medium text-foreground mb-1">Phone</h3>
                <p className="text-sm text-muted-foreground">01-XXXXXXX</p>
                <p className="text-sm text-muted-foreground">98XXXXXXXX</p>
                <p className="text-xs text-muted-foreground mt-1">Sun-Fri: 10 AM - 6 PM</p>
              </div>
              
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mb-3">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-medium text-foreground mb-1">Email</h3>
                <p className="text-sm text-muted-foreground break-all">marketplaceauthentic01@gmail.com</p>
                <p className="text-xs text-muted-foreground mt-1">Response within 24 hours</p>
              </div>
              
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mb-3">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-medium text-foreground mb-1">Location</h3>
                <p className="text-sm text-muted-foreground">New Road</p>
                <p className="text-sm text-muted-foreground">Kathmandu, Nepal</p>
              </div>
            </div>
          </div>

          {/* Customer Acknowledgment */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-2">Customer Acknowledgment</h2>
            <p className="text-sm text-muted-foreground mb-4">
              By using our Platform and making a purchase, you acknowledge that:
            </p>
            <div className="space-y-2">
              {[
                "You have read and understood these Terms and Conditions",
                "You agree to be bound by these Terms",
                "You have read our Refund Policy and accept the \"No Refund\" terms",
                "You are of legal age to enter into this agreement",
                "You understand that all sales are final",
                "You accept responsibility for your purchase decisions"
              ].map((item, index) => (
                <div key={index} className="flex items-start gap-2">
                  <span className="text-primary font-bold">✓</span>
                  <span className="text-sm text-muted-foreground">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Final Warning */}
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-6 text-center mb-8">
            <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-3" />
            <h2 className="text-lg font-bold text-destructive mb-2">⚠️ FINAL NOTICE ⚠️</h2>
            <p className="text-sm font-medium text-foreground mb-2">
              IF YOU DO NOT AGREE WITH THESE TERMS, PLEASE DO NOT USE OUR PLATFORM OR MAKE ANY PURCHASES
            </p>
            <p className="text-sm text-muted-foreground">
              Your continued use of our Platform constitutes acceptance of these Terms and Conditions.
            </p>
          </div>

          {/* Footer */}
          <div className="text-center text-sm text-muted-foreground space-y-1 border-t pt-6">
            <p className="font-medium text-foreground">Marketplace Nepal Pvt. Ltd.</p>
            <p>Registration No.: XXXXX/XXX</p>
            <p>PAN No.: XXXXXXXXX</p>
            <p>New Road, Kathmandu, Nepal</p>
            <p className="text-xs mt-2">
              Last Reviewed: Magh 22, 2082 BS (January 5, 2026)
            </p>
            <p className="text-xs">Version 1.0</p>
            <p className="text-xs font-medium mt-2">© 2024-2026 Marketplace. All Rights Reserved.</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
