import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function TermsAndConditions() {
  const navigate = useNavigate();

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

        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-foreground mb-8">Terms and Conditions</h1>

          <div className="prose prose-gray dark:prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Introduction</h2>
              <p className="text-muted-foreground">
                Welcome to our marketplace. By accessing or using our platform, you agree to be
                bound by these Terms and Conditions. Please read them carefully before making
                any purchase or using our services.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. Order and Payment</h2>
              <p className="text-muted-foreground">
                When you place an order, you are making an offer to purchase the products
                selected. All orders are subject to acceptance and availability. Payment must
                be made through the available payment methods: Cash on Delivery (COD) or Online
                Payment (Bank Transfer, Esewa).
              </p>
              <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                <li>All prices are in Nepali Rupees (Rs.)</li>
                <li>Prices include applicable taxes unless otherwise stated</li>
                <li>We reserve the right to refuse or cancel any order</li>
                <li>For online payments, proof of payment must be uploaded</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. Shipping and Delivery</h2>
              <p className="text-muted-foreground">
                We aim to deliver your order within the estimated timeframe. However, delivery
                times may vary depending on your location and other factors. We are not
                responsible for delays caused by circumstances beyond our control.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Returns and Refunds</h2>
              <p className="text-muted-foreground">
                If you are not satisfied with your purchase, you may request a return within 7
                days of delivery. Items must be unused and in their original packaging. Refunds
                will be processed within 7-14 business days after we receive the returned item.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Loyalty Points</h2>
              <p className="text-muted-foreground">
                Our loyalty program allows you to earn points on purchases. Points are subject
                to the following conditions:
              </p>
              <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                <li>Points are earned after order delivery is confirmed</li>
                <li>Points expire after 12 months of inactivity</li>
                <li>Points cannot be exchanged for cash</li>
                <li>We reserve the right to modify the loyalty program</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Product Reviews</h2>
              <p className="text-muted-foreground">
                Only verified buyers (customers who have purchased and received the product)
                can leave reviews. Reviews must be honest and not contain offensive content.
                We reserve the right to remove reviews that violate our guidelines.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">7. Privacy</h2>
              <p className="text-muted-foreground">
                Your privacy is important to us. We collect and use your personal information
                only to process orders and improve our services. We do not share your
                information with third parties except as necessary to fulfill orders.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">8. Limitation of Liability</h2>
              <p className="text-muted-foreground">
                We shall not be liable for any indirect, incidental, special, or consequential
                damages arising from the use of our platform or products. Our liability is
                limited to the amount paid for the products in question.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">9. Changes to Terms</h2>
              <p className="text-muted-foreground">
                We reserve the right to modify these terms at any time. Changes will be
                effective immediately upon posting on the platform. Continued use of our
                services after changes constitutes acceptance of the new terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">10. Contact Us</h2>
              <p className="text-muted-foreground">
                If you have any questions about these Terms and Conditions, please contact our
                customer support team.
              </p>
            </section>
          </div>

          <p className="text-sm text-muted-foreground mt-8 pt-4 border-t">
            Last updated: January 6, 2026
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
