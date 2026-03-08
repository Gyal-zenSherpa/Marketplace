-- Fix 1: Restrict user_notifications INSERT to only own user_id
DROP POLICY IF EXISTS "Authenticated can insert notifications" ON public.user_notifications;
CREATE POLICY "Users can only insert own notifications"
ON public.user_notifications FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Fix 2: Prevent users from self-promoting to seller via trigger
CREATE OR REPLACE FUNCTION public.protect_is_seller()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- If is_seller is being changed and the user is not an admin, block it
  IF OLD.is_seller IS DISTINCT FROM NEW.is_seller THEN
    IF NOT has_role(auth.uid(), 'admin') THEN
      NEW.is_seller := OLD.is_seller;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_is_seller_trigger ON public.profiles;
CREATE TRIGGER protect_is_seller_trigger
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.protect_is_seller();

-- Fix 3: Tighten products INSERT to require is_seller = true
DROP POLICY IF EXISTS "Sellers can insert their products" ON public.products;
CREATE POLICY "Sellers can insert their products"
ON public.products FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = seller_id AND
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_seller = true)
);