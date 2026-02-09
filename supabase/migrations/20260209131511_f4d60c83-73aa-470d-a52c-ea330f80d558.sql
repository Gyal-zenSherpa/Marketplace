
-- Explicitly deny all anonymous/unauthenticated access to orders
CREATE POLICY "Deny anonymous access to orders"
ON public.orders
AS RESTRICTIVE
FOR ALL
TO public
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);
