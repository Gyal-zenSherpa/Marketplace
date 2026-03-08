
-- Fix 1: Lock down user_loyalty UPDATE to admin-only (prevent client-side points manipulation)
DROP POLICY IF EXISTS "Users can update own loyalty" ON public.user_loyalty;
CREATE POLICY "Only admins can update loyalty"
ON public.user_loyalty FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix 2: Lock down points_transactions INSERT to service-role only
-- Current policy "Only service role can insert transactions" uses WITH CHECK (false)
-- which is correct, but let's ensure no other permissive INSERT policies exist
DROP POLICY IF EXISTS "System can insert transactions" ON public.points_transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON public.points_transactions;

-- Fix 3: Add redeem-points function config
-- (handled via config.toml update)
