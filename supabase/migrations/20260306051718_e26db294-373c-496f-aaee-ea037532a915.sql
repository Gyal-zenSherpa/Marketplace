
-- Fix ads RLS: drop RESTRICTIVE policies and recreate as PERMISSIVE
DROP POLICY IF EXISTS "Admins can manage ads" ON public.ads;
DROP POLICY IF EXISTS "Anyone can view active ads" ON public.ads;

CREATE POLICY "Admins can manage ads"
ON public.ads
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view active ads"
ON public.ads
FOR SELECT
TO anon, authenticated
USING (is_active = true);
