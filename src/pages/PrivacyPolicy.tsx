import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Shield, Lock, Eye, Database, Bell, Users, Globe, Mail, Phone } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const sections = [
  {
    icon: Database,
    title: "Information We Collect",
    content: [
      {
        subtitle: "Personal Information You Provide",
        items: [
          "Full name, email address, phone number, and shipping address when you create an account or place an order",
          "Payment details (processed securely through authorized payment gateways — we do not store card numbers)",
          "Profile information including avatar, preferences, and communication history",
          "Messages sent through our customer support or chat assistant",
        ]
      },
      {
        subtitle: "Information Collected Automatically",
        items: [
          "Device information (browser type, operating system, screen resolution)",
          "IP address and approximate geographic location",
          "Pages visited, time spent, click patterns, and search queries",
          "Cookies and similar tracking technologies (see our Cookie Policy for details)",
          "Referring website or app that directed you to our platform",
        ]
      }
    ]
  },
  {
    icon: Eye,
    title: "How We Use Your Information",
    content: [
      {
        subtitle: "To Provide Our Services",
        items: [
          "Process and fulfill your orders, including shipping and delivery",
          "Manage your account, preferences, and purchase history",
          "Provide customer support and respond to inquiries",
          "Send order confirmations, shipping updates, and delivery notifications",
        ]
      },
      {
        subtitle: "To Improve & Personalize",
        items: [
          "Analyze browsing patterns to recommend relevant products",
          "Improve website performance, navigation, and user experience",
          "Conduct A/B testing to optimize features and layouts",
          "Generate aggregated analytics to understand market trends",
        ]
      },
      {
        subtitle: "To Communicate",
        items: [
          "Send promotional emails and special offers (with your consent)",
          "Notify you about changes to our terms, policies, or services",
          "Deliver loyalty program updates and reward notifications",
        ]
      }
    ]
  },
  {
    icon: Users,
    title: "Information Sharing & Disclosure",
    content: [
      {
        subtitle: "We May Share Your Information With",
        items: [
          "Sellers — only the information necessary to fulfill your orders (name, shipping address, phone number)",
          "Payment processors — to securely handle transactions (eSewa, Khalti, ConnectIPS, etc.)",
          "Delivery partners — shipping address and contact details for order delivery",
          "Analytics providers — anonymized, aggregated data to improve our services",
        ]
      },
      {
        subtitle: "We Will Never",
        items: [
          "Sell your personal data to third parties for marketing purposes",
          "Share your payment information with sellers or unauthorized parties",
          "Disclose your data except as required by law or to protect our legal rights",
        ]
      }
    ]
  },
  {
    icon: Lock,
    title: "Data Security",
    content: [
      {
        subtitle: "How We Protect Your Data",
        items: [
          "SSL/TLS encryption for all data transmitted between your device and our servers",
          "Secure password hashing — we never store passwords in plain text",
          "Regular security audits and vulnerability assessments",
          "Rate limiting and brute-force protection on login attempts",
          "Role-based access controls limiting employee access to personal data",
          "Secure, encrypted database storage with regular backups",
        ]
      },
      {
        subtitle: "Your Responsibilities",
        items: [
          "Keep your account credentials confidential and do not share them",
          "Use a strong, unique password for your Marketplace account",
          "Log out from shared or public devices after use",
          "Report any suspicious activity on your account immediately",
        ]
      }
    ]
  },
  {
    icon: Bell,
    title: "Your Rights & Choices",
    content: [
      {
        subtitle: "You Have the Right To",
        items: [
          "Access — request a copy of the personal data we hold about you",
          "Correction — update or correct inaccurate information in your profile",
          "Deletion — request deletion of your account and associated data",
          "Opt-out — unsubscribe from marketing emails at any time via the link in each email",
          "Data portability — request your data in a machine-readable format",
          "Restrict processing — limit how we use your data in certain circumstances",
        ]
      },
      {
        subtitle: "How to Exercise Your Rights",
        items: [
          "Update your profile information directly in your account settings",
          "Manage notification preferences from your profile page",
          "Contact us at marketplaceauthentic01@gmail.com for data access or deletion requests",
          "We will respond to all valid requests within 30 business days",
        ]
      }
    ]
  },
  {
    icon: Globe,
    title: "Cookies & Tracking",
    content: [
      {
        subtitle: "We Use Cookies For",
        items: [
          "Essential functionality — keeping you logged in, maintaining your shopping cart",
          "Analytics — understanding how users interact with our platform",
          "Personalization — remembering your preferences and browsing history",
          "Advertising — delivering relevant ads through Google AdSense (third-party cookies)",
        ]
      },
      {
        subtitle: "Managing Cookies",
        items: [
          "You can manage cookie preferences through your browser settings",
          "Disabling essential cookies may affect website functionality",
          "See our detailed Cookie Policy for more information",
        ]
      }
    ]
  },
];

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Privacy Policy - Marketplace Nepal</title>
        <meta name="description" content="Read our Privacy Policy to understand how Marketplace Nepal collects, uses, and protects your personal information. Your privacy and data security are our priority." />
      </Helmet>
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
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Privacy Policy</h1>
            <p className="text-muted-foreground">Last Updated: March 7, 2026</p>
            <p className="text-sm text-muted-foreground mt-3 max-w-2xl mx-auto">
              At Marketplace Nepal, we take your privacy seriously. This policy explains what information we collect, 
              how we use it, and the choices you have regarding your data.
            </p>
          </div>

          {/* Sections */}
          <div className="space-y-8">
            {sections.map((section, idx) => {
              const Icon = section.icon;
              return (
                <div key={idx} className="bg-card border border-border rounded-xl p-5 md:p-7">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-primary/10 p-2.5 rounded-lg">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <h2 className="text-lg md:text-xl font-semibold text-foreground">{section.title}</h2>
                  </div>
                  <div className="space-y-5">
                    {section.content.map((block, bIdx) => (
                      <div key={bIdx}>
                        <h3 className="font-medium text-foreground text-sm mb-2">{block.subtitle}</h3>
                        <ul className="space-y-1.5">
                          {block.items.map((item, iIdx) => (
                            <li key={iIdx} className="flex items-start gap-2 text-sm text-muted-foreground">
                              <span className="text-primary mt-1 shrink-0">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Data Handling */}
          <div className="bg-card border border-border rounded-xl p-5 md:p-7 mt-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-primary/10 p-2.5 rounded-lg">
                <Database className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-lg md:text-xl font-semibold text-foreground">Data Handling</h2>
            </div>
            <div className="space-y-5">
              <div>
                <h3 className="font-medium text-foreground text-sm mb-2">How We Process Your Data</h3>
                <ul className="space-y-1.5">
                  <li className="flex items-start gap-2 text-sm text-muted-foreground"><span className="text-primary mt-1 shrink-0">•</span><span>All data is processed on secure servers located within our cloud infrastructure with encryption at rest and in transit</span></li>
                  <li className="flex items-start gap-2 text-sm text-muted-foreground"><span className="text-primary mt-1 shrink-0">•</span><span>Personal data is only accessed by authorized personnel on a need-to-know basis for order fulfillment and support</span></li>
                  <li className="flex items-start gap-2 text-sm text-muted-foreground"><span className="text-primary mt-1 shrink-0">•</span><span>We minimize data collection — we only gather information that is necessary to provide and improve our services</span></li>
                  <li className="flex items-start gap-2 text-sm text-muted-foreground"><span className="text-primary mt-1 shrink-0">•</span><span>Automated decision-making is limited to product recommendations based on anonymized browsing patterns</span></li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-foreground text-sm mb-2">Data Transfer & Storage</h3>
                <ul className="space-y-1.5">
                  <li className="flex items-start gap-2 text-sm text-muted-foreground"><span className="text-primary mt-1 shrink-0">•</span><span>Your data may be transferred to third-party services (payment processors, delivery partners) only as necessary to fulfill orders</span></li>
                  <li className="flex items-start gap-2 text-sm text-muted-foreground"><span className="text-primary mt-1 shrink-0">•</span><span>All third-party partners are contractually obligated to protect your data and use it solely for the intended purpose</span></li>
                  <li className="flex items-start gap-2 text-sm text-muted-foreground"><span className="text-primary mt-1 shrink-0">•</span><span>We perform regular data backups and maintain disaster recovery procedures to prevent data loss</span></li>
                </ul>
              </div>
            </div>
          </div>

          {/* Children's Privacy */}
          <div className="bg-muted/50 rounded-xl p-5 md:p-7 mt-8">
            <h2 className="text-lg font-semibold text-foreground mb-3">Children's Privacy</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Our platform is not intended for use by children under the age of 18. We do not knowingly collect 
              personal information from minors. If you are a parent or guardian and believe your child has provided 
              us with personal data, please contact us immediately and we will take steps to remove that information.
            </p>
          </div>

          {/* Data Retention */}
          <div className="bg-muted/50 rounded-xl p-5 md:p-7 mt-6">
            <h2 className="text-lg font-semibold text-foreground mb-3">Data Retention</h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              We retain your personal data for as long as necessary to provide our services and fulfill the purposes described in this policy:
            </p>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              <li className="flex items-start gap-2"><span className="text-primary">•</span> Account data — retained while your account is active, deleted within 90 days of account closure</li>
              <li className="flex items-start gap-2"><span className="text-primary">•</span> Order history — retained for 7 years for tax and legal compliance</li>
              <li className="flex items-start gap-2"><span className="text-primary">•</span> Analytics data — anonymized and aggregated after 24 months</li>
              <li className="flex items-start gap-2"><span className="text-primary">•</span> Security logs — retained for 12 months for fraud prevention</li>
            </ul>
          </div>

          {/* Policy Changes */}
          <div className="bg-muted/50 rounded-xl p-5 md:p-7 mt-6">
            <h2 className="text-lg font-semibold text-foreground mb-3">Changes to This Policy</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We may update this Privacy Policy from time to time. When we make significant changes, we will notify you 
              via email or a prominent notice on our platform. Your continued use of our services after changes are posted 
              constitutes acceptance of the updated policy. We encourage you to review this page periodically.
            </p>
          </div>

          {/* Contact */}
          <div className="bg-primary text-primary-foreground rounded-xl p-5 md:p-7 mt-8 text-center">
            <h2 className="text-lg font-bold mb-2">Questions About Your Privacy?</h2>
            <p className="text-sm opacity-90 mb-4">
              If you have questions, concerns, or requests regarding your personal data, contact our privacy team:
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center text-sm">
              <a href="mailto:marketplaceauthentic01@gmail.com" className="inline-flex items-center gap-2 opacity-90 hover:opacity-100">
                <Mail className="h-4 w-4" /> marketplaceauthentic01@gmail.com
              </a>
              <a href="tel:9763689295" className="inline-flex items-center gap-2 opacity-90 hover:opacity-100">
                <Phone className="h-4 w-4" /> 9763689295
              </a>
            </div>
          </div>

          {/* Legal Compliance */}
          <div className="mt-8 text-center text-sm text-muted-foreground space-y-1">
            <p>This policy complies with the Electronic Transactions Act 2063 (2008) and Privacy Act 2075 (2018) of Nepal.</p>
            <p className="font-medium text-foreground mt-3">Marketplace Nepal Pvt. Ltd.</p>
            <p>New Road, Kathmandu, Nepal</p>
            <p className="text-xs">© 2024-2026 Marketplace. All Rights Reserved.</p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
