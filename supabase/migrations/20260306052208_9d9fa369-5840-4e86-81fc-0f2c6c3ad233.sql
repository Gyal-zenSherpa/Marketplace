
-- Drop all existing restrictive policies on ads
DROP POLICY IF EXISTS "Admins can manage ads" ON public.ads;
DROP POLICY IF EXISTS "Anyone can view active ads" ON public.ads;

-- Recreate as PERMISSIVE (default)
CREATE POLICY "Admins can manage ads"
ON public.ads
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view active ads"
ON public.ads
FOR SELECT
TO anon, authenticated
USING (is_active = true);
