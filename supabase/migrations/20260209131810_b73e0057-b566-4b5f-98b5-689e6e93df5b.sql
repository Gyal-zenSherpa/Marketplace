
-- 1. Drop the existing user SELECT policy
DROP POLICY IF EXISTS "Users can view own application" ON public.seller_applications;

-- 2. Create a security-definer function that returns limited application info for users
CREATE OR REPLACE FUNCTION public.get_my_seller_application()
RETURNS TABLE (
  id uuid,
  status text,
  business_name text,
  admin_notes text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    id,
    status,
    business_name,
    admin_notes,
    created_at,
    updated_at
  FROM public.seller_applications
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;
