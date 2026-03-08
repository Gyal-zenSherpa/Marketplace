
DROP POLICY "System can insert commission transactions" ON public.commission_transactions;
CREATE POLICY "Only admins can insert commission transactions"
ON public.commission_transactions FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
