-- Drop existing SELECT policies on seller_applications
DROP POLICY IF EXISTS "Users can view own application" ON public.seller_applications;
DROP POLICY IF EXISTS "Admins can view all applications" ON public.seller_applications;

-- Recreate as PERMISSIVE policies (default) for proper OR logic
-- Users can ONLY view their OWN application
CREATE POLICY "Users can view own application"
ON public.seller_applications
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admins can view ALL applications
CREATE POLICY "Admins can view all applications"
ON public.seller_applications
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));