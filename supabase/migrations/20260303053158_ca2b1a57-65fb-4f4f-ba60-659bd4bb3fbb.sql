
-- Drop the security definer view and replace with a regular view with RLS-compatible approach
DROP VIEW IF EXISTS public.seller_commission_summary;

-- Recreate as a regular view (not security definer)
CREATE OR REPLACE VIEW public.seller_commission_summary 
WITH (security_invoker = true)
AS
SELECT 
  ct.seller_id,
  COUNT(*) FILTER (WHERE ct.payment_status != 'cancelled') AS total_sales_count,
  COALESCE(SUM(ct.commission_amount) FILTER (WHERE ct.payment_status != 'cancelled'), 0) AS total_commission_generated,
  COALESCE(SUM(ct.commission_amount) FILTER (WHERE ct.payment_status = 'paid'), 0) AS commission_paid,
  COALESCE(SUM(ct.commission_amount) FILTER (WHERE ct.payment_status IN ('pending', 'overdue')), 0) AS commission_dues,
  MIN(ct.payment_due_date) FILTER (WHERE ct.payment_status IN ('pending', 'overdue')) AS next_due_date,
  CASE 
    WHEN COUNT(*) FILTER (WHERE ct.payment_status = 'overdue') > 0 THEN 'overdue'
    WHEN COUNT(*) FILTER (WHERE ct.payment_status = 'pending') > 0 THEN 'pending'
    ELSE 'paid'
  END AS overall_status
FROM public.commission_transactions ct
GROUP BY ct.seller_id;
