
-- Explicitly deny all anonymous/unauthenticated access to seller_applications
CREATE POLICY "Deny anonymous access to seller_applications"
ON public.seller_applications
AS RESTRICTIVE
FOR ALL
TO public
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);
