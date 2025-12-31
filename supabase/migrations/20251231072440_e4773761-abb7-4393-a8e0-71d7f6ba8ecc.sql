-- Add UPDATE policy for order_items
CREATE POLICY "Users can update own order items" 
ON public.order_items 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM orders 
  WHERE orders.id = order_items.order_id 
  AND orders.user_id = auth.uid()
));

-- Make audit logs immutable - explicitly deny UPDATE and DELETE for everyone
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.security_audit_log;
DROP POLICY IF EXISTS "Service role can insert audit logs" ON public.security_audit_log;

-- Recreate with immutable design
CREATE POLICY "Admins can view audit logs" 
ON public.security_audit_log 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert audit logs" 
ON public.security_audit_log 
FOR INSERT 
WITH CHECK (true);

-- Explicitly block UPDATE and DELETE
CREATE POLICY "No updates allowed on audit logs" 
ON public.security_audit_log 
FOR UPDATE 
USING (false);

CREATE POLICY "No deletes allowed on audit logs" 
ON public.security_audit_log 
FOR DELETE 
USING (false);

-- Add data retention cleanup function for failed_login_attempts
CREATE OR REPLACE FUNCTION public.cleanup_old_security_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete failed login attempts older than 30 days
  DELETE FROM public.failed_login_attempts
  WHERE created_at < now() - interval '30 days';
  
  -- Delete rate limit records older than 1 hour
  DELETE FROM public.rate_limits
  WHERE window_start < now() - interval '1 hour';
END;
$$;