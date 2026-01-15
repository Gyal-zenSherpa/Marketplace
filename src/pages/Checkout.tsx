import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CreditCard, Truck, ShoppingBag, Banknote, QrCode, ImageIcon, Upload, X } from "lucide-react";
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

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB.",
        variant: "destructive",
      });
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

      const { data: { publicUrl } } = supabase.storage
        .from("payment-proofs")
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error("Payment proof upload error:", error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        variant: "destructive",
        title: "Login required",
        description: "Please login to complete your order",
      });
      navigate("/auth");
      return;
    }

    // Validate payment proof for online payments
    if (paymentMethod === "online" && !paymentProof) {
      toast({
        variant: "destructive",
        title: "Payment proof required",
        description: "Please upload a screenshot of your payment.",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const validated = shippingSchema.parse(formData);

      // Record T&C agreement
      await supabase.from("terms_agreements").insert({
        user_id: user.id,
        version: "1.0",
        user_agent: navigator.userAgent,
      });

      // Create order with email included for shipping notifications
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          total: grandTotal,
          shipping_address: { ...validated, paymentMethod, email: user.email },
          status: "pending",
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Upload payment proof if online payment
      let paymentProofUrl: string | null = null;
      if (paymentMethod === "online" && paymentProof) {
        setUploadingProof(true);
        paymentProofUrl = await uploadPaymentProof(order.id);
        setUploadingProof(false);

        if (paymentProofUrl) {
          // Update order with payment proof URL
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
        console.log('Order confirmation email sent');
      } catch (emailError) {
        console.error('Failed to send order confirmation email:', emailError);
        // Don't fail the order if email fails
      }

      clearCart();
      toast({
        title: "Order placed!",
        description: paymentMethod === "cod" 
          ? "Thank you! Pay when your order arrives. Check your email for confirmation." 
          : "Thank you! Your payment proof has been submitted. Check your email for confirmation.",
      });
      navigate("/orders");
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast({
          variant: "destructive",
          title: "Validation error",
          description: err.errors[0].message,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Order failed",
          description: "Something went wrong. Please try again.",
        });
      }
    } finally {
      setIsProcessing(false);
      setUploadingProof(false);
    }
  };

  const shipping = 0;
  const tax = totalPrice * 0.1;
  const grandTotal = totalPrice + shipping + tax;

  const formatPrice = (price: number) => `Rs. ${price.toFixed(2)}`;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Shopping
        </button>

        <h1 className="text-3xl font-bold text-foreground mb-8">Checkout</h1>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Shipping Form */}
          <div className="bg-card rounded-2xl shadow-card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Truck className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-xl font-semibold text-foreground">Shipping Information</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="Ram Bahadur"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Street Address</Label>
                <Input
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Thamel, Kathmandu"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="Kathmandu"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">Province</Label>
                  <Input
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    placeholder="Bagmati"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="zipCode">Postal Code</Label>
                  <Input
                    id="zipCode"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleInputChange}
                    placeholder="44600"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+977 9800000000"
                    required
                  />
                </div>
              </div>
            </form>
          </div>

          {/* Order Summary */}
          <div className="bg-card rounded-2xl shadow-card p-6 h-fit">
            <h2 className="text-xl font-semibold text-foreground mb-6">Order Summary</h2>

            <div className="space-y-4 mb-6">
              {cartItems.map((item) => (
                <div key={item.id} className="flex gap-4">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-16 w-16 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground line-clamp-1">{item.name}</h3>
                    <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                  </div>
                  <span className="font-medium text-foreground">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-border pt-4 space-y-3">
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
              <div className="flex justify-between pt-3 border-t border-border">
                <span className="font-semibold text-foreground">Total</span>
                <span className="font-bold text-xl text-foreground">{formatPrice(grandTotal)}</span>
              </div>
            </div>

            {/* Payment Method Selection */}
            <div className="mt-6 pt-6 border-t border-border">
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
                      <p className="font-medium">Cash on Delivery (COD)</p>
                      <p className="text-sm text-muted-foreground">Pay when your order arrives</p>
                    </div>
                  </Label>
                </div>
                
                <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:border-primary transition-colors cursor-pointer">
                  <RadioGroupItem value="online" id="online" />
                  <Label htmlFor="online" className="flex items-center gap-2 cursor-pointer flex-1">
                    <QrCode className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium">Online Payment</p>
                      <p className="text-sm text-muted-foreground">Pay via Bank Transfer or Esewa</p>
                    </div>
                  </Label>
                </div>
              </RadioGroup>

              {/* QR Codes for Online Payment */}
              {paymentMethod === "online" && (
                <div className="mt-6 p-4 bg-secondary/50 rounded-lg">
                  <h4 className="font-medium text-foreground mb-4">Select Payment Method</h4>
                  
                  {/* Payment Type Selection */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {paymentQRCodes.map((qr) => (
                      <button
                        key={qr.id}
                        type="button"
                        onClick={() => setSelectedPaymentType(qr.type as PaymentType)}
                        className={`p-3 rounded-lg border-2 text-center transition-all ${
                          selectedPaymentType === qr.type
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <span className="font-medium text-sm">{qr.name}</span>
                      </button>
                    ))}
                  </div>

                  {/* Show selected QR code */}
                  {selectedPaymentType && (
                    <div className="text-center mb-4">
                      {(() => {
                        const selectedQR = paymentQRCodes.find((qr) => qr.type === selectedPaymentType);
                        return selectedQR?.image_url ? (
                          <div className="inline-block">
                            <img
                              src={selectedQR.image_url}
                              alt={selectedQR.name}
                              className="w-48 h-48 object-contain rounded-lg border-2 border-border mx-auto"
                            />
                            <p className="mt-2 text-sm font-medium">{selectedQR.name}</p>
                            <p className="text-xs text-muted-foreground">Scan to pay</p>
                          </div>
                        ) : (
                          <div className="w-48 h-48 mx-auto rounded-lg border-2 border-dashed border-border flex items-center justify-center">
                            <div className="text-center text-muted-foreground">
                              <ImageIcon className="h-10 w-10 mx-auto mb-2" />
                              <p className="text-sm">QR not available</p>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* Payment Proof Upload */}
                  {selectedPaymentType && (
                    <div className="mt-6 pt-4 border-t border-border">
                      <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                        <Upload className="h-4 w-4" />
                        Upload Payment Screenshot
                      </h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Please upload a screenshot of your payment confirmation
                      </p>
                      
                      {paymentProofPreview ? (
                        <div className="relative w-full max-w-xs mx-auto">
                          <img
                            src={paymentProofPreview}
                            alt="Payment proof preview"
                            className="w-full rounded-lg border"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute -top-2 -right-2 h-8 w-8"
                            onClick={removePaymentProof}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div
                          onClick={() => paymentProofInputRef.current?.click()}
                          className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
                        >
                          <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">Click to upload payment screenshot</p>
                          <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 5MB</p>
                        </div>
                      )}
                      <input
                        ref={paymentProofInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handlePaymentProofChange}
                        className="hidden"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Terms and Place Order */}
            <div className="mt-6 space-y-4">
              {/* Terms and Conditions */}
              <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-border"
                />
                <label htmlFor="terms" className="text-sm text-muted-foreground cursor-pointer">
                  👇 Read the{" "}
                  <a
                    href="/terms"
                    target="_blank"
                    className="text-primary hover:underline font-medium"
                  >
                    Terms and Conditions
                  </a>{" "}
                  carefully before placing your order. By checking this box, you agree to our terms.
                </label>
              </div>

              <Button
                type="submit"
                onClick={handleSubmit}
                className="w-full gradient-hero text-primary-foreground h-12"
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
