
CREATE OR REPLACE FUNCTION public.get_my_seller_application()
 RETURNS TABLE(id uuid, status text, business_name text, admin_notes text, created_at timestamp with time zone, updated_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
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
  ORDER BY created_at DESC
  LIMIT 1;
$$;
