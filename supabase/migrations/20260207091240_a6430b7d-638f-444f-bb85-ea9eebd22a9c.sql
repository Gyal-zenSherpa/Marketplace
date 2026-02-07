-- Fix payment-proofs bucket security: make it private
UPDATE storage.buckets 
SET public = false 
WHERE id = 'payment-proofs';

-- Drop the overly permissive policy for payment proofs
DROP POLICY IF EXISTS "Anyone can view payment proofs" ON storage.objects;

-- Allow users to view their own payment proofs
CREATE POLICY "Users can view own payment proofs"
ON storage.objects FOR SELECT
USING (bucket_id = 'payment-proofs' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow admins to view all payment proofs for verification
CREATE POLICY "Admins can view all payment proofs"
ON storage.objects FOR SELECT
USING (bucket_id = 'payment-proofs' AND public.has_role(auth.uid(), 'admin'));

-- Ensure seller-documents has proper admin access policy (drop and recreate)
DROP POLICY IF EXISTS "Admins can view seller documents" ON storage.objects;
CREATE POLICY "Admins can view seller documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'seller-documents' AND public.has_role(auth.uid(), 'admin'));