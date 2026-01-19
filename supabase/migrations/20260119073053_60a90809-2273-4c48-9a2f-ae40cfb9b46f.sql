-- Drop the remaining permissive policies
DROP POLICY IF EXISTS "System can insert audit logs" ON public.security_audit_log;
DROP POLICY IF EXISTS "System can insert transactions" ON public.points_transactions;

-- Create restrictive policy for points_transactions - only service role can insert
-- This ensures points are only added through validated backend operations
CREATE POLICY "Only service role can insert transactions"
ON public.points_transactions
FOR INSERT
WITH CHECK (false);