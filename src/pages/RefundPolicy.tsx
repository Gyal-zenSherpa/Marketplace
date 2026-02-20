import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  ChevronDown, 
  ChevronUp, 
  AlertCircle, 
  AlertTriangle,
  ShieldX,
  Gift,
  Clock,
  Camera,
  Mail, 
  Phone, 
  MapPin,
  CheckCircle,
  XCircle,
  FileText,
  HelpCircle
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { cn } from "@/lib/utils";

const sections = [
  {
    id: 1,
    title: "Overview - Our No Refund Policy",
    icon: ShieldX,
    content: `⚠️ ALL SALES ARE FINAL

Marketplace Nepal operates under a strict NO CASH REFUND, NO RETURN, NO EXCHANGE policy for all purchases.

Key Points:
• Once a product is sold and payment is made, the sale is final
• We do not offer cash refunds under any circumstances
• We do not accept returns for exchange of different products
• ONCE SOLD IS FOREVER SOLD

This policy applies to all products, all payment methods, and all delivery locations. Please make your purchase decisions carefully.`
  },
  {
    id: 2,
    title: "Why We Have This Policy",
    icon: HelpCircle,
    content: `Our no-refund policy exists for several important reasons:

Business Sustainability:
• We offer competitive prices by minimizing operational costs
• Processing returns and refunds adds significant overhead
• Our pricing model is based on final sales

Product Integrity:
• Fashion and lifestyle products can be easily damaged once opened
• We cannot resell returned items as new
• Hygiene concerns for certain product categories

Fraud Prevention:
• Return fraud is a significant issue in e-commerce
• This policy protects both the business and genuine customers
• It allows us to maintain lower prices for everyone

We encourage all customers to:
• Read product descriptions carefully
• Check size charts before ordering
• Contact us with questions before purchasing
• Review your order before confirming payment`
  },
  {
    id: 3,
    title: "Store Credit Exceptions",
    icon: Gift,
    content: `While we do not offer cash refunds, we provide STORE CREDIT in the following limited circumstances:

1. Our Shipping Errors:
• Wrong item sent (different product than ordered)
• Wrong size sent (different from what was ordered)
• Wrong color sent (different from what was ordered)

2. Manufacturing Defects:
• Item arrives with manufacturing defects
• Item must be unworn and in original condition
• Must be reported within 48 hours of delivery

3. Shipping Damage:
• Item damaged during transit
• Must have photo/video proof of damage
• Must be reported within 24 hours of delivery
• Damage must be noted on delivery receipt

4. Non-Delivery:
• Package confirmed as lost by courier
• Package not delivered within 15 days of shipping
• After thorough investigation confirms non-delivery

Important: Store credit is NOT cash. It can only be used for future purchases on our platform.`
  },
  {
    id: 4,
    title: "Store Credit Terms & Conditions",
    icon: FileText,
    content: `If you qualify for store credit, the following terms apply:

Credit Value:
• Store credit equals 100% of the original purchase price
• Includes product price only (shipping charges not included)

Validity:
• Store credit has NO expiration date
• Can be used anytime for future purchases

Usage:
• Can be applied to any product on our platform
• Can be used in full or partial amounts
• Remaining balance carries forward
• Can be combined with other payment methods

Restrictions:
• Store credit is NON-TRANSFERABLE
• Cannot be redeemed for cash
• Cannot be sold or gifted to others
• One store credit per customer account

Issuance:
• Store credit is issued within 48-72 hours of approval
• Credit code will be sent to your registered email
• Must be applied at checkout to use`
  },
  {
    id: 5,
    title: "What Does NOT Qualify",
    icon: XCircle,
    content: `Store credit will NOT be issued for the following:

Customer Errors:
• Ordered wrong size/color/style
• Changed your mind after ordering
• No longer want the product
• Ordered wrong item by mistake

Fit Issues:
• Item doesn't fit as expected
• Size is different from what customer imagined
• Customer measured incorrectly

Usage/Damage by Customer:
• Item has been worn, washed, or used
• Tags have been removed
• Item has been altered
• Item has perfume, deodorant, or other smells
• Item has makeup stains or marks

Late Reporting:
• Issues reported after 48 hours of delivery
• Damage not noted on delivery receipt
• Claims made after product has been used

Other:
• Buyer's remorse
• Found cheaper elsewhere
• Gift recipient doesn't like it
• Product doesn't match expectation (if matches description)
• Color looks different on screen (natural variation)`
  },
  {
    id: 6,
    title: "Reporting Timeline",
    icon: Clock,
    content: `STRICT TIMELINES - Please adhere to these deadlines:

Within 24 Hours of Delivery:
• Shipping damage claims
• Missing items in package
• Visibly damaged packaging

Within 48 Hours of Delivery:
• Wrong item received
• Manufacturing defects
• Quality issues

After 48 Hours:
• NO claims will be accepted
• No exceptions to this timeline
• Product is considered accepted as-is

Important Notes:
• Timeline starts from delivery confirmation, not order date
• Keep delivery receipt until timeline passes
• Take photos/videos immediately upon delivery
• Document any issues before using/wearing the product`
  },
  {
    id: 7,
    title: "How to Report an Issue",
    icon: Camera,
    content: `If you have a valid issue within the timeline, follow these steps:

Step 1: Document the Issue
• Take clear photos of the problem
• Take video if applicable
• Keep the original packaging
• Keep delivery receipt

Step 2: Contact Us
• Email: marketplaceauthentic01@gmail.com
• WhatsApp: 98XXXXXXXX
• Phone: 01-XXXXXXX

Step 3: Provide Required Information
• Order number
• Product name and description
• Clear photos/videos of the issue
• Delivery receipt photo
• Brief description of the problem

Step 4: Wait for Response
• We will review your claim within 24-48 hours
• Additional information may be requested
• You will receive email confirmation of decision

Step 5: Resolution
• If approved, store credit issued within 48-72 hours
• Credit code sent to your registered email
• Instructions for using credit provided`
  },
  {
    id: 8,
    title: "Investigation Process",
    icon: FileText,
    content: `All claims undergo a thorough investigation:

What We Review:
• Order details and history
• Delivery confirmation and receipt
• Photos/videos provided
• Product condition
• Timeline of claim

Our Process:
• Claims reviewed by customer service team
• May contact courier for shipping damage claims
• May request additional photos or information
• Decision made based on evidence provided

Possible Outcomes:
• Approved: Store credit issued
• Denied: Explanation provided
• Partial: Partial store credit may be offered

Appeal Process:
• If you disagree with decision, you may appeal once
• Provide additional evidence with appeal
• Final decision made within 48 hours
• All decisions after appeal are final

Note: We reserve the right to deny claims that appear fraudulent or do not meet our criteria.`
  }
];

const noRefundItems = [
  "Customer ordered wrong size/color",
  "Change of mind or no longer wanted",
  "Item doesn't fit as expected",
  "Item worn, washed, or used",
  "Tags removed from item",
  "Issues reported after 48 hours",
  "Gift recipient doesn't like it",
  "Found item cheaper elsewhere"
];

const storeCreditItems = [
  "Wrong item shipped by us",
  "Manufacturing defects (within 48hrs)",
  "Shipping damage (within 24hrs with proof)",
  "Non-delivery (after investigation)"
];

export default function RefundPolicy() {
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
      <main className="container mx-auto px-4 py-6 md:py-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6 md:mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-6 md:mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 md:w-16 md:h-16 bg-destructive/10 rounded-full mb-4">
              <ShieldX className="h-7 w-7 md:h-8 md:w-8 text-destructive" />
            </div>
            <h1 className="text-2xl md:text-4xl font-bold text-foreground mb-2">Refund Policy</h1>
            <p className="text-sm md:text-base text-muted-foreground">Last Updated: January 5, 2026</p>
          </div>

          {/* Critical Warning */}
          <div className="bg-destructive/10 border-2 border-destructive/30 rounded-lg p-4 md:p-6 mb-6 md:mb-8">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-6 w-6 md:h-8 md:w-8 text-destructive shrink-0" />
              <div>
                <h2 className="text-lg md:text-xl font-bold text-destructive mb-2">⚠️ NO CASH REFUNDS</h2>
                <p className="text-sm md:text-base text-foreground font-medium mb-2">
                  ALL SALES ARE FINAL. We do NOT offer cash refunds, returns, or exchanges.
                </p>
                <p className="text-xs md:text-sm text-muted-foreground">
                  Please read this policy carefully before making a purchase. By placing an order, you acknowledge and accept these terms.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Reference Cards */}
          <div className="grid md:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
            {/* No Refund */}
            <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4 md:p-5">
              <div className="flex items-center gap-2 mb-3 md:mb-4">
                <XCircle className="h-5 w-5 text-destructive" />
                <h3 className="font-semibold text-destructive text-sm md:text-base">NO Refund For:</h3>
              </div>
              <ul className="space-y-2">
                {noRefundItems.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-xs md:text-sm text-muted-foreground">
                    <XCircle className="h-3.5 w-3.5 md:h-4 md:w-4 text-destructive shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Store Credit */}
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 md:p-5">
              <div className="flex items-center gap-2 mb-3 md:mb-4">
                <Gift className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-primary text-sm md:text-base">Store Credit For:</h3>
              </div>
              <ul className="space-y-2">
                {storeCreditItems.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-xs md:text-sm text-muted-foreground">
                    <CheckCircle className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Important Notice */}
          <div className="bg-accent/10 border border-accent/30 rounded-lg p-4 mb-6 md:mb-8">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-accent shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-foreground mb-1 text-sm md:text-base">Important Reminder</h3>
                <p className="text-xs md:text-sm text-muted-foreground">
                  Store credit is NOT cash. It can only be used for future purchases on our platform and cannot be transferred, sold, or redeemed for cash.
                </p>
              </div>
            </div>
          </div>

          {/* Expandable Sections */}
          <div className="border rounded-lg divide-y bg-card mb-6 md:mb-8">
            {sections.map((section) => {
              const IconComponent = section.icon;
              return (
                <div key={section.id}>
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="w-full px-4 md:px-6 py-3 md:py-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-2 md:gap-3">
                      <IconComponent className="h-4 w-4 md:h-5 md:w-5 text-primary shrink-0" />
                      <span className="font-medium text-foreground text-left text-sm md:text-base">
                        {section.id}. {section.title}
                      </span>
                    </div>
                    {expandedSections[section.id] ? (
                      <ChevronUp className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground shrink-0" />
                    ) : (
                      <ChevronDown className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground shrink-0" />
                    )}
                  </button>
                  
                  <div className={cn(
                    "overflow-hidden transition-all duration-200",
                    expandedSections[section.id] ? "max-h-[2000px]" : "max-h-0"
                  )}>
                    <div className="px-4 md:px-6 pb-4 pt-2">
                      <pre className="whitespace-pre-wrap font-sans text-xs md:text-sm text-muted-foreground leading-relaxed">
                        {section.content}
                      </pre>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Customer Acknowledgment */}
          <div className="bg-muted/50 rounded-lg p-4 md:p-6 mb-6 md:mb-8">
            <h2 className="text-base md:text-lg font-semibold text-foreground mb-2">By Making a Purchase, You Agree:</h2>
            <div className="space-y-2">
              {[
                "I have read and understood the No Refund Policy",
                "I understand that all sales are final",
                "I have checked size, color, and product details before ordering",
                "I accept that store credit is the only exception (if applicable)",
                "I will report any issues within the specified timeline"
              ].map((item, index) => (
                <div key={index} className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span className="text-xs md:text-sm text-muted-foreground">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Final Notice */}
          <div className="bg-destructive/10 border-2 border-destructive/30 rounded-lg p-4 md:p-6 text-center mb-6 md:mb-8">
            <AlertTriangle className="h-6 w-6 md:h-8 md:w-8 text-destructive mx-auto mb-2 md:mb-3" />
            <h2 className="text-base md:text-lg font-bold text-destructive mb-2">ONCE SOLD IS FOREVER SOLD</h2>
            <p className="text-xs md:text-sm text-foreground font-medium mb-2">
              Please make informed purchase decisions.
            </p>
            <p className="text-xs md:text-sm text-muted-foreground">
              We cannot process refunds, returns, or exchanges. Your purchase is final.
            </p>
          </div>

          {/* Footer */}
          <div className="text-center text-xs md:text-sm text-muted-foreground space-y-1 border-t pt-4 md:pt-6">
            <p className="font-medium text-foreground">Marketplace Nepal Pvt. Ltd.</p>
            <p>New Road, Kathmandu, Nepal</p>
            <p className="text-xs mt-2">Last Reviewed: Magh 22, 2082 BS (January 5, 2026)</p>
            <p className="text-xs font-medium mt-2">© 2024-2026 Marketplace. All Rights Reserved.</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
