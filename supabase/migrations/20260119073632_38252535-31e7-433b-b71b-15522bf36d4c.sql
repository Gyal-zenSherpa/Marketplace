-- Secure product-images storage: Only sellers can upload
DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Sellers can upload product images" ON storage.objects;

-- Create policy that checks is_seller status
CREATE POLICY "Sellers can upload product images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'product-images' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.is_seller = true
  )
);

-- Sellers can update their own product images
DROP POLICY IF EXISTS "Sellers can update product images" ON storage.objects;
CREATE POLICY "Sellers can update product images"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'product-images' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.is_seller = true
  )
);

-- Sellers can delete their own product images
DROP POLICY IF EXISTS "Sellers can delete product images" ON storage.objects;
CREATE POLICY "Sellers can delete product images"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'product-images' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.is_seller = true
  )
);