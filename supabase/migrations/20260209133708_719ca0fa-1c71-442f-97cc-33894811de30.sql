
-- Fix seller_applications: ensure admin SELECT is PERMISSIVE (currently all policies are RESTRICTIVE, 
-- which means no one can SELECT since there's no permissive policy to satisfy).
-- Users access their status via the get_my_seller_application() RPC function only.

-- Drop the existing RESTRICTIVE admin SELECT policy
DROP POLICY IF EXISTS "Admins can view all applications" ON public.seller_applications;

-- Create it as PERMISSIVE so admins can actually read applications
CREATE POLICY "Admins can view all applications"
ON public.seller_applications
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Drop the existing RESTRICTIVE admin UPDATE policy and recreate as PERMISSIVE
DROP POLICY IF EXISTS "Admins can update applications" ON public.seller_applications;

CREATE POLICY "Admins can update applications"
ON public.seller_applications
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- The "Users can submit application" INSERT policy also needs to be permissive for inserts to work
DROP POLICY IF EXISTS "Users can submit application" ON public.seller_applications;

CREATE POLICY "Users can submit application"
ON public.seller_applications
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- The "Users can update pending application" UPDATE also needs to be permissive
DROP POLICY IF EXISTS "Users can update pending application" ON public.seller_applications;

CREATE POLICY "Users can update pending application"
ON public.seller_applications
FOR UPDATE
TO authenticated
USING ((auth.uid() = user_id) AND (status = 'pending'::text));

-- Keep the RESTRICTIVE "Deny anonymous access" policy as-is (it's the guard rail)
-- It ensures auth.uid() IS NOT NULL for all operations
