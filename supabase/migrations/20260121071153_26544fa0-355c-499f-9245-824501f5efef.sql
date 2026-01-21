-- Create a dedicated storage bucket for payment QR codes
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-qr-codes', 'payment-qr-codes', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for payment-qr-codes bucket
-- Admins can upload payment QR codes
CREATE POLICY "Admins can upload payment QR codes"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'payment-qr-codes' AND public.has_role(auth.uid(), 'admin'));

-- Anyone can view payment QR codes (they're public)
CREATE POLICY "Anyone can view payment QR codes"
ON storage.objects FOR SELECT
USING (bucket_id = 'payment-qr-codes');

-- Admins can update payment QR codes
CREATE POLICY "Admins can update payment QR codes"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'payment-qr-codes' AND public.has_role(auth.uid(), 'admin'));

-- Admins can delete payment QR codes
CREATE POLICY "Admins can delete payment QR codes"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'payment-qr-codes' AND public.has_role(auth.uid(), 'admin'));