import { Helmet } from "react-helmet-async";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AlertTriangle, Info, Shield, Scale } from "lucide-react";

const Disclaimer = () => {
  return (
    <>
      <Helmet>
        <title>Disclaimer | Marketplace Nepal</title>
        <meta name="description" content="Read the official disclaimer for Marketplace Nepal. Understand the limitations of liability, accuracy of information, and terms of use for our platform." />
        <link rel="canonical" href="https://marketplace-gzn.lovable.app/disclaimer" />
      </Helmet>
      <Header />
      <main className="min-h-screen bg-background">
        <div className="bg-gradient-to-br from-primary/10 via-background to-accent/10 py-12 md:py-16">
          <div className="container mx-auto px-4 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <AlertTriangle className="h-7 w-7 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">Disclaimer</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">Last updated: March 2026</p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-10 md:py-14 max-w-4xl">
          <div className="space-y-10">
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Info className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold text-foreground">General Information</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                The information provided on Marketplace Nepal ("the Platform") is for general informational purposes only. All information on the Platform is provided in good faith; however, we make no representation or warranty of any kind, express or implied, regarding the accuracy, adequacy, validity, reliability, availability, or completeness of any information on the Platform.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Under no circumstance shall we have any liability to you for any loss or damage of any kind incurred as a result of the use of the Platform or reliance on any information provided on the Platform. Your use of the Platform and your reliance on any information on the Platform is solely at your own risk.
              </p>
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold text-foreground">Product Listings & Third-Party Content</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Marketplace Nepal acts as a platform connecting buyers and sellers. Product listings, descriptions, images, pricing, and other seller-provided content are the sole responsibility of the respective sellers. We do not independently verify the accuracy, quality, safety, or legality of items listed by sellers.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                We encourage buyers to exercise due diligence before making any purchase. Product images may vary slightly from the actual product due to photography, lighting, or screen display differences. Always review product details carefully and contact the seller for specific questions.
              </p>
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Scale className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold text-foreground">No Professional Advice</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                The Platform does not provide professional, financial, legal, medical, or any other type of advice. Content published on the Platform, including blog posts, product descriptions, and guides, is for informational and educational purposes only. You should consult with a qualified professional before making decisions based on information found on this Platform.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">Pricing & Availability</h2>
              <p className="text-muted-foreground leading-relaxed">
                All prices listed on Marketplace Nepal are in Nepali Rupees (NPR) and are subject to change without prior notice. While we strive to ensure pricing accuracy, errors may occur. In the event of a pricing error, we reserve the right to cancel any orders placed at the incorrect price. Product availability is not guaranteed and may change at any time.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">External Links</h2>
              <p className="text-muted-foreground leading-relaxed">
                The Platform may contain links to third-party websites or services that are not owned or controlled by Marketplace Nepal. We have no control over, and assume no responsibility for, the content, privacy policies, or practices of any third-party websites or services. We strongly advise you to read the terms and conditions and privacy policies of any third-party websites or services that you visit.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">User-Generated Content</h2>
              <p className="text-muted-foreground leading-relaxed">
                Reviews, ratings, comments, and other user-generated content on the Platform represent the opinions of individual users and do not reflect the views of Marketplace Nepal. We do not endorse, verify, or guarantee the accuracy of user-generated content. Users are responsible for ensuring their content complies with applicable laws and our community guidelines.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">Limitation of Liability</h2>
              <p className="text-muted-foreground leading-relaxed">
                To the fullest extent permitted by applicable law, Marketplace Nepal, its owners, operators, and affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, goodwill, or other intangible losses, resulting from your use of or inability to use the Platform or any transactions conducted through the Platform.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">Governing Law</h2>
              <p className="text-muted-foreground leading-relaxed">
                This disclaimer is governed by and construed in accordance with the laws of Nepal, including the Electronic Transactions Act 2063, Consumer Protection Act 2075, and Privacy Act 2075. Any disputes arising from your use of the Platform shall be subject to the exclusive jurisdiction of the courts of Nepal.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">Changes to This Disclaimer</h2>
              <p className="text-muted-foreground leading-relaxed">
                We reserve the right to modify this disclaimer at any time. Changes will be effective immediately upon posting to the Platform. Your continued use of the Platform after any modifications constitutes acceptance of the updated disclaimer.
              </p>
            </section>

            <div className="rounded-lg border border-border bg-card p-6 mt-8">
              <h3 className="font-semibold text-foreground mb-2">Questions About This Disclaimer?</h3>
              <p className="text-muted-foreground text-sm">
                If you have questions about this disclaimer, please contact us at{" "}
                <a href="mailto:marketplaceauthentic01@gmail.com" className="text-primary hover:underline">
                  marketplaceauthentic01@gmail.com
                </a>{" "}
                or via WhatsApp/Viber at 9763689295.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default Disclaimer;
