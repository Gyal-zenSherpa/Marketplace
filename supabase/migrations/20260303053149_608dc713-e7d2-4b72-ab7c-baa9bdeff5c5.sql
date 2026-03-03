
-- Commission configuration table (platform-level settings)
CREATE TABLE public.commission_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value text NOT NULL,
  description text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.commission_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage commission config"
ON public.commission_config FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Sellers can view commission config"
ON public.commission_config FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Insert default config values
INSERT INTO public.commission_config (key, value, description) VALUES
  ('default_rate', '10', 'Default commission rate % for 0-100 sales'),
  ('loyalty_rate', '7', 'Commission rate % after 100 confirmed sales'),
  ('loyalty_threshold', '100', 'Number of confirmed sales to qualify for loyalty rate'),
  ('dispute_rate', '2', 'Flat commission rate % for dispute/refund cases'),
  ('grace_period_days', '30', 'Days sellers have to pay commission'),
  ('overdue_penalty_pct', '0', 'Penalty percentage on overdue amounts'),
  ('bypass_penalty_amount', '100000', 'Penalty amount (Rs) for platform bypass');

-- Commission transactions table (immutable per-sale commission log)
CREATE TABLE public.commission_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
  order_item_id uuid REFERENCES public.order_items(id) ON DELETE RESTRICT,
  seller_id uuid NOT NULL,
  product_name text NOT NULL,
  sale_price numeric NOT NULL,
  tax_amount numeric NOT NULL DEFAULT 0,
  post_tax_amount numeric NOT NULL,
  commission_rate numeric NOT NULL,
  commission_amount numeric NOT NULL,
  net_to_seller numeric NOT NULL,
  payment_status text NOT NULL DEFAULT 'pending',
  payment_due_date timestamptz NOT NULL,
  paid_at timestamptz,
  is_dispute boolean NOT NULL DEFAULT false,
  is_refund boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.commission_transactions ENABLE ROW LEVEL SECURITY;

-- Immutable: no updates or deletes from client (only admin can update payment_status)
CREATE POLICY "Admins can view all commission transactions"
ON public.commission_transactions FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update commission transactions"
ON public.commission_transactions FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Sellers can view own commission transactions"
ON public.commission_transactions FOR SELECT
USING (auth.uid() = seller_id);

CREATE POLICY "System can insert commission transactions"
ON public.commission_transactions FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- No delete policy = immutable logs

-- Commission payments table (tracks when sellers pay their dues)
CREATE TABLE public.commission_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL,
  amount numeric NOT NULL,
  payment_method text,
  reference_number text,
  notes text,
  recorded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.commission_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage commission payments"
ON public.commission_payments FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Sellers can view own payments"
ON public.commission_payments FOR SELECT
USING (auth.uid() = seller_id);

-- Seller commission summary view (aggregate per seller)
CREATE OR REPLACE VIEW public.seller_commission_summary AS
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

-- Indexes for performance
CREATE INDEX idx_commission_transactions_seller ON public.commission_transactions(seller_id);
CREATE INDEX idx_commission_transactions_order ON public.commission_transactions(order_id);
CREATE INDEX idx_commission_transactions_status ON public.commission_transactions(payment_status);
CREATE INDEX idx_commission_transactions_due_date ON public.commission_transactions(payment_due_date);
CREATE INDEX idx_commission_payments_seller ON public.commission_payments(seller_id);

-- Trigger to update updated_at
CREATE TRIGGER update_commission_transactions_updated_at
BEFORE UPDATE ON public.commission_transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to calculate commission rate for a seller
CREATE OR REPLACE FUNCTION public.get_seller_commission_rate(p_seller_id uuid)
RETURNS numeric
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_confirmed_sales integer;
  v_default_rate numeric;
  v_loyalty_rate numeric;
  v_loyalty_threshold integer;
BEGIN
  -- Count confirmed sales
  SELECT COUNT(*) INTO v_confirmed_sales
  FROM public.commission_transactions
  WHERE seller_id = p_seller_id AND payment_status != 'cancelled';
  
  -- Get config values
  SELECT value::numeric INTO v_default_rate FROM public.commission_config WHERE key = 'default_rate';
  SELECT value::numeric INTO v_loyalty_rate FROM public.commission_config WHERE key = 'loyalty_rate';
  SELECT value::integer INTO v_loyalty_threshold FROM public.commission_config WHERE key = 'loyalty_threshold';
  
  -- Default fallbacks
  v_default_rate := COALESCE(v_default_rate, 10);
  v_loyalty_rate := COALESCE(v_loyalty_rate, 7);
  v_loyalty_threshold := COALESCE(v_loyalty_threshold, 100);
  
  IF v_confirmed_sales >= v_loyalty_threshold THEN
    RETURN v_loyalty_rate;
  ELSE
    RETURN v_default_rate;
  END IF;
END;
$$;
