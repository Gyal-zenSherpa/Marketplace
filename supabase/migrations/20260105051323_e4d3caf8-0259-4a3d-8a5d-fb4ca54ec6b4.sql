-- Create table for payment QR codes
CREATE TABLE public.payment_qr_codes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('bank', 'esewa', 'other')),
  image_url text,
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_qr_codes ENABLE ROW LEVEL SECURITY;

-- Anyone can view active payment QR codes
CREATE POLICY "Anyone can view active payment QR codes"
ON public.payment_qr_codes
FOR SELECT
USING (is_active = true);

-- Only admins can manage payment QR codes
CREATE POLICY "Admins can manage payment QR codes"
ON public.payment_qr_codes
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default payment methods
INSERT INTO public.payment_qr_codes (name, type, display_order) VALUES
('Bank Transfer', 'bank', 1),
('Esewa', 'esewa', 2),
('Other Payment', 'other', 3);