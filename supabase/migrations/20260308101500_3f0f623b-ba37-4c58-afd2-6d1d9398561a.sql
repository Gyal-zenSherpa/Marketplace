DROP POLICY IF EXISTS "System can insert commission transactions" ON public.commission_transactions;
DROP POLICY IF EXISTS "Only admins can insert commission transactions" ON public.commission_transactions;

CREATE POLICY "Service role only inserts commission transactions"
ON public.commission_transactions FOR INSERT
TO authenticated
WITH CHECK (false);