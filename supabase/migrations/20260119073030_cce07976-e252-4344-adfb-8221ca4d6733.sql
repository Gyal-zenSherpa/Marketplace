-- Drop the overly permissive insert policy on security_audit_log
DROP POLICY IF EXISTS "Authenticated users can insert audit logs" ON public.security_audit_log;

-- Create a restrictive policy that only allows service role inserts
-- The security-middleware edge function uses service role, so it bypasses RLS
-- This prevents direct client-side inserts while allowing the edge function to work
CREATE POLICY "Only service role can insert audit logs"
ON public.security_audit_log
FOR INSERT
WITH CHECK (false);

-- Note: The security-middleware edge function uses SUPABASE_SERVICE_ROLE_KEY
-- which bypasses RLS entirely, so setting WITH CHECK (false) blocks client inserts
-- while the edge function continues to work