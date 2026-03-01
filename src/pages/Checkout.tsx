import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CreditCard, Truck, ShoppingBag, Banknote, QrCode, ImageIcon, Upload, X, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { z } from "zod";
import { formatNepaliPrice, formatNepaliNumber } from "@/lib/formatNepali";

const shippingSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required").max(100),
  address: z.string().trim().min(1, "Address is required").max(200),
  city: z.string().trim().min(1, "City is required").max(100),
  state: z.string().trim().min(1, "State is required").max(100),
  zipCode: z.string().trim().min(1, "ZIP code is required").max(20),
  phone: z.string().trim().min(1, "Phone is required").max(20),
});

interface PaymentQRCode {
  id: string;
  name: string;
  type: string;
  image_url: string | null;
  display_order: number;
}

type PaymentType = "bank" | "esewa" | "other";

export default function Checkout() {
  const navigate = useNavigate();
  const { cartItems, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "online">("cod");
  const [selectedPaymentType, setSelectedPaymentType] = useState<PaymentType | null>(null);
  const [paymentQRCodes, setPaymentQRCodes] = useState<PaymentQRCode[]>([]);
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [paymentProofPreview, setPaymentProofPreview] = useState<string | null>(null);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const paymentProofInputRef = useRef<HTMLInputElement>(null);

  // Loyalty points state
  const [availablePoints, setAvailablePoints] = useState(0);
  const [pointsToUse, setPointsToUse] = useState(0);
  const [applyingPoints, setApplyingPoints] = useState(false);
  const [pointsVerified, setPointsVerified] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    phone: "",
  });

  useEffect(() => {
    const fetchPaymentQRCodes = async () => {
      const { data, error } = await supabase
        .from("payment_qr_codes")
        .select("*")
        .eq("is_active", true)
        .order("display_order");

      if (!error && data) {
        setPaymentQRCodes(data);
      }
    };

    fetchPaymentQRCodes();
  }, []);

  // Fetch loyalty points
  useEffect(() => {
    const fetchLoyaltyPoints = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("user_loyalty")
        .select("available_points")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data) {
        setAvailablePoints(data.available_points);
      }
    };

    fetchLoyaltyPoints();
  }, [user]);

  // Verify points whenever pointsToUse changes
  useEffect(() => {
    setPointsVerified(false);
  }, [pointsToUse]);

  const verifyAndApplyPoints = async () => {
    if (!user || pointsToUse <= 0) return;

    setApplyingPoints(true);
    try {
      // Re-fetch available points from DB
      const { data: freshLoyalty, error } = await supabase
        .from("user_loyalty")
        .select("available_points, total_points")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error || !freshLoyalty) {
        toast({ variant: "destructive", title: "Error", description: "Could not fetch loyalty points. You may not have a loyalty account yet." });
        setPointsToUse(0);
        return;
      }

      // Update local available points with fresh data
      setAvailablePoints(freshLoyalty.available_points);

      if (freshLoyalty.available_points <= 0) {
        toast({ variant: "destructive", title: "No points available", description: "You don't have any loyalty points to redeem." });
        setPointsToUse(0);
        return;
      }

      if (pointsToUse > freshLoyalty.available_points) {
        const capped = freshLoyalty.available_points;
        setPointsToUse(capped);
        toast({
          variant: "destructive",
          title: "Insufficient points",
          description: `You only have ${formatNepaliNumber(freshLoyalty.available_points)} available points. Adjusted automatically.`,
        });
        return;
      }

      // Cap at order total (subtotal + tax)
      const maxDiscount = totalPrice + totalPrice * 0.1;
      if (pointsToUse > maxDiscount) {
        setPointsToUse(Math.floor(maxDiscount));
        toast({ title: "Points adjusted", description: `Maximum ${formatNepaliNumber(Math.floor(maxDiscount))} points can be applied.` });
        return;
      }

      setPointsVerified(true);
      toast({ title: "Points verified ✓", description: `${formatNepaliNumber(pointsToUse)} points will be applied as ${formatNepaliPrice(pointsToUse)} discount.` });
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to verify points. Please try again." });
      setPointsToUse(0);
    } finally {
      setApplyingPoints(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-4">Your cart is empty</h1>
          <p className="text-muted-foreground mb-6">Add some products before checking out</p>
          <Button onClick={() => navigate("/")}>Continue Shopping</Button>
        </div>
        <Footer />
      </div>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handlePaymentProofChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file type", description: "Please upload an image file.", variant: "destructive" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Please upload an image smaller than 5MB.", variant: "destructive" });
      return;
    }

    setPaymentProof(file);
    setPaymentProofPreview(URL.createObjectURL(file));
  };

  const removePaymentProof = () => {
    setPaymentProof(null);
    setPaymentProofPreview(null);
    if (paymentProofInputRef.current) {
      paymentProofInputRef.current.value = "";
    }
  };

  const uploadPaymentProof = async (orderId: string): Promise<string | null> => {
    if (!paymentProof || !user) return null;

    try {
      const fileExt = paymentProof.name.split(".").pop();
      const fileName = `${user.id}/${orderId}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("payment-proofs")
        .upload(fileName, paymentProof, { upsert: true });

      if (uploadError) throw uploadError;
      return fileName;
    } catch (error) {
      console.error("Payment proof upload error:", error);
      return null;
    }
  };

  const shipping = 0;
  const tax = totalPrice * 0.1;
  const pointsDiscount = pointsVerified ? pointsToUse : 0;
  const grandTotal = Math.max(0, totalPrice + shipping + tax - pointsDiscount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({ variant: "destructive", title: "Login required", description: "Please login to complete your order" });
      navigate("/auth");
      return;
    }

    if (paymentMethod === "online" && !paymentProof) {
      toast({ variant: "destructive", title: "Payment proof required", description: "Please upload a screenshot of your payment." });
      return;
    }

    // Re-verify points before placing order
    if (pointsToUse > 0 && pointsVerified) {
      const { data: freshLoyalty } = await supabase
        .from("user_loyalty")
        .select("available_points")
        .eq("user_id", user.id)
        .single();

      if (!freshLoyalty || freshLoyalty.available_points < pointsToUse) {
        toast({ variant: "destructive", title: "Points changed", description: "Your available points changed. Please re-verify." });
        setPointsVerified(false);
        return;
      }
    }

    setIsProcessing(true);

    try {
      const validated = shippingSchema.parse(formData);

      await supabase.from("terms_agreements").insert({
        user_id: user.id,
        version: "1.0",
        user_agent: navigator.userAgent,
      });

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          total: grandTotal,
          shipping_address: { ...validated, paymentMethod, email: user.email, pointsUsed: pointsDiscount },
          status: "pending",
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Deduct loyalty points if used
      if (pointsDiscount > 0) {
        await supabase
          .from("user_loyalty")
          .update({
            available_points: availablePoints - pointsDiscount,
            total_points: availablePoints - pointsDiscount,
          })
          .eq("user_id", user.id);
      }

      // Upload payment proof if online payment
      let paymentProofUrl: string | null = null;
      if (paymentMethod === "online" && paymentProof) {
        setUploadingProof(true);
        paymentProofUrl = await uploadPaymentProof(order.id);
        setUploadingProof(false);

        if (paymentProofUrl) {
          await supabase
            .from("orders")
            .update({ payment_proof_url: paymentProofUrl })
            .eq("id", order.id);
        }
      }

      // Create order items
      const orderItems = cartItems.map((item) => ({
        order_id: order.id,
        product_id: item.id.length === 36 ? item.id : null,
        product_name: item.name,
        product_price: item.price,
        quantity: item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Create notification for order placed
      await supabase.from("user_notifications").insert({
        user_id: user.id,
        title: "Order Placed Successfully! 🎉",
        message: `Your order #${order.id.slice(0, 8).toUpperCase()} has been placed. We'll notify you when it ships.`,
        type: "order",
        link: "/orders",
      });

      // Send order confirmation email
      try {
        await supabase.functions.invoke('send-order-confirmation', {
          body: {
            orderId: order.id,
            userEmail: user.email,
            userName: validated.fullName,
            orderItems: cartItems.map(item => ({
              product_name: item.name,
              quantity: item.quantity,
              product_price: item.price,
            })),
            total: grandTotal,
            shippingAddress: {
              fullName: validated.fullName,
              address: validated.address,
              city: validated.city,
              postalCode: validated.zipCode,
              phone: validated.phone,
            },
            paymentMethod,
          },
        });
      } catch (emailError) {
        console.error('Failed to send order confirmation email:', emailError);
      }

      clearCart();
      toast({
        title: "Order placed!",
        description: paymentMethod === "cod"
          ? "Thank you! Pay when your order arrives."
          : "Thank you! Your payment proof has been submitted.",
      });
      navigate("/orders");
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast({ variant: "destructive", title: "Validation error", description: err.errors[0].message });
      } else {
        toast({ variant: "destructive", title: "Order failed", description: "Something went wrong. Please try again." });
      }
    } finally {
      setIsProcessing(false);
      setUploadingProof(false);
    }
  };

  const formatPrice = (price: number) => formatNepaliPrice(price);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-4 sm:py-8">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4 sm:mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Shopping
        </button>

        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-4 sm:mb-8">Checkout</h1>

        <div className="grid lg:grid-cols-2 gap-4 sm:gap-8">
          {/* Shipping Form */}
          <div className="bg-card rounded-2xl shadow-card p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Truck className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-lg sm:text-xl font-semibold text-foreground">Shipping Information</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" name="fullName" value={formData.fullName} onChange={handleInputChange} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Street Address</Label>
                <Input id="address" name="address" value={formData.address} onChange={handleInputChange} required />
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" name="city" value={formData.city} onChange={handleInputChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">Province</Label>
                  <Input id="state" name="state" value={formData.state} onChange={handleInputChange} required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="zipCode">Postal Code</Label>
                  <Input id="zipCode" name="zipCode" value={formData.zipCode} onChange={handleInputChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleInputChange} required />
                </div>
              </div>
            </form>
          </div>

          {/* Order Summary */}
          <div className="bg-card rounded-2xl shadow-card p-4 sm:p-6 h-fit">
            <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-4 sm:mb-6">Order Summary</h2>

            <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
              {cartItems.map((item) => (
                <div key={item.id} className="flex gap-3 sm:gap-4">
                  <img src={item.image} alt={item.name} className="h-14 w-14 sm:h-16 sm:w-16 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground line-clamp-1 text-sm sm:text-base">{item.name}</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">Qty: {item.quantity}</p>
                  </div>
                  <span className="font-medium text-foreground text-sm sm:text-base whitespace-nowrap">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-border pt-4 space-y-2 sm:space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="text-foreground">{formatPrice(totalPrice)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span className="text-primary font-medium">Free</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax (10%)</span>
                <span className="text-foreground">{formatPrice(tax)}</span>
              </div>
              {pointsDiscount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span className="flex items-center gap-1"><Coins className="h-3.5 w-3.5" /> Points Discount</span>
                  <span>-{formatPrice(pointsDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between pt-3 border-t border-border">
                <span className="font-semibold text-foreground">Total</span>
                <span className="font-bold text-lg sm:text-xl text-foreground">{formatPrice(grandTotal)}</span>
              </div>
            </div>

            {/* Loyalty Points Section */}
            {user && availablePoints > 0 && (
              <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-border">
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Coins className="h-5 w-5 text-amber-600" />
                  Use Loyalty Points
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  You have <span className="font-semibold text-amber-600">{formatNepaliNumber(availablePoints)}</span> points available (1 point = Rs. 1)
                </p>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min={0}
                    max={availablePoints}
                    value={pointsToUse || ""}
                    onChange={(e) => {
                      const val = Math.min(Number(e.target.value) || 0, availablePoints);
                      setPointsToUse(val);
                    }}
                    placeholder="Enter points to use"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant={pointsVerified ? "default" : "outline"}
                    onClick={verifyAndApplyPoints}
                    disabled={applyingPoints || pointsToUse <= 0 || pointsVerified}
                    className="whitespace-nowrap"
                  >
                    {applyingPoints ? "Verifying..." : pointsVerified ? "Verified ✓" : "Apply"}
                  </Button>
                </div>
                {pointsVerified && (
                  <p className="text-xs text-green-600 mt-2">
                    ✓ {pointsToUse} points verified and applied (-{formatPrice(pointsDiscount)})
                  </p>
                )}
              </div>
            )}

            {/* Payment Method Selection */}
            <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-border">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Payment Method
              </h3>
              
              <RadioGroup
                value={paymentMethod}
                onValueChange={(value) => setPaymentMethod(value as "cod" | "online")}
                className="space-y-3"
              >
                <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:border-primary transition-colors cursor-pointer">
                  <RadioGroupItem value="cod" id="cod" />
                  <Label htmlFor="cod" className="flex items-center gap-2 cursor-pointer flex-1">
                    <Banknote className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium text-sm sm:text-base">Cash on Delivery (COD)</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">Pay when your order arrives</p>
                    </div>
                  </Label>
                </div>
                
                <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:border-primary transition-colors cursor-pointer">
                  <RadioGroupItem value="online" id="online" />
                  <Label htmlFor="online" className="flex items-center gap-2 cursor-pointer flex-1">
                    <QrCode className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-sm sm:text-base">Online Payment</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">Pay via Bank Transfer or Esewa</p>
                    </div>
                  </Label>
                </div>
              </RadioGroup>

              {/* QR Codes for Online Payment */}
              {paymentMethod === "online" && (
                <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-secondary/50 rounded-lg">
                  <h4 className="font-medium text-foreground mb-4">Select Payment Method</h4>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 mb-4">
                    {paymentQRCodes.map((qr) => (
                      <button
                        key={qr.id}
                        type="button"
                        onClick={() => setSelectedPaymentType(qr.type as PaymentType)}
                        className={`p-2 sm:p-3 rounded-lg border-2 text-center transition-all ${
                          selectedPaymentType === qr.type
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <span className="font-medium text-xs sm:text-sm">{qr.name}</span>
                      </button>
                    ))}
                  </div>

                  {selectedPaymentType && (
                    <div className="text-center mb-4">
                      {(() => {
                        const selectedQR = paymentQRCodes.find((qr) => qr.type === selectedPaymentType);
                        return selectedQR?.image_url ? (
                          <div className="inline-block">
                            <img src={selectedQR.image_url} alt={selectedQR.name} className="w-40 h-40 sm:w-48 sm:h-48 object-contain rounded-lg border-2 border-border mx-auto" />
                            <p className="mt-2 text-sm font-medium">{selectedQR.name}</p>
                            <p className="text-xs text-muted-foreground">Scan to pay</p>
                          </div>
                        ) : (
                          <div className="w-40 h-40 sm:w-48 sm:h-48 mx-auto rounded-lg border-2 border-dashed border-border flex items-center justify-center">
                            <div className="text-center text-muted-foreground">
                              <ImageIcon className="h-10 w-10 mx-auto mb-2" />
                              <p className="text-sm">QR not available</p>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {selectedPaymentType && (
                    <div className="mt-4 sm:mt-6 pt-4 border-t border-border">
                      <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                        <Upload className="h-4 w-4" />
                        Upload Payment Screenshot
                      </h4>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-3">
                        Please upload a screenshot of your payment confirmation
                      </p>
                      
                      {paymentProofPreview ? (
                        <div className="relative w-full max-w-xs mx-auto">
                          <img src={paymentProofPreview} alt="Payment proof preview" className="w-full rounded-lg border" />
                          <Button type="button" variant="destructive" size="icon" className="absolute -top-2 -right-2 h-8 w-8" onClick={removePaymentProof}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div onClick={() => paymentProofInputRef.current?.click()} className="border-2 border-dashed border-border rounded-lg p-6 sm:p-8 text-center cursor-pointer hover:border-primary transition-colors">
                          <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                          <p className="text-xs sm:text-sm text-muted-foreground">Click to upload payment screenshot</p>
                          <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 5MB</p>
                        </div>
                      )}
                      <input ref={paymentProofInputRef} type="file" accept="image/*" onChange={handlePaymentProofChange} className="hidden" />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Terms and Place Order */}
            <div className="mt-4 sm:mt-6 space-y-4">
              <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-border"
                />
                <label htmlFor="terms" className="text-xs sm:text-sm text-muted-foreground cursor-pointer">
                  👇 Read the{" "}
                  <a href="/terms" target="_blank" className="text-primary hover:underline font-medium">
                    Terms and Conditions
                  </a>{" "}
                  carefully before placing your order. By checking this box, you agree to our terms.
                </label>
              </div>

              <Button
                type="submit"
                onClick={handleSubmit}
                className="w-full gradient-hero text-primary-foreground h-11 sm:h-12"
                disabled={isProcessing || !agreedToTerms || (paymentMethod === "online" && (!selectedPaymentType || !paymentProof))}
              >
                <CreditCard className="h-5 w-5 mr-2" />
                {isProcessing ? "Processing..." : `Place Order - ${formatPrice(grandTotal)}`}
              </Button>

              {!agreedToTerms && (
                <p className="text-xs text-center text-muted-foreground">
                  Please agree to Terms and Conditions to proceed
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
