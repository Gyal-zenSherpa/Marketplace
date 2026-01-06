-- ===============================================
-- PRODUCT REVIEWS SYSTEM
-- ===============================================

-- Create product reviews table
CREATE TABLE public.product_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  order_id UUID REFERENCES public.orders(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  content TEXT,
  is_verified_purchase BOOLEAN DEFAULT false,
  helpful_count INTEGER DEFAULT 0,
  badges TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Review media (photos/videos)
CREATE TABLE public.review_media (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id UUID NOT NULL REFERENCES public.product_reviews(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Review helpful votes
CREATE TABLE public.review_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id UUID NOT NULL REFERENCES public.product_reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(review_id, user_id)
);

-- Enable RLS on review tables
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_votes ENABLE ROW LEVEL SECURITY;

-- RLS for product_reviews
CREATE POLICY "Anyone can view reviews" ON public.product_reviews
  FOR SELECT USING (true);

CREATE POLICY "Users can create own reviews" ON public.product_reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews" ON public.product_reviews
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reviews" ON public.product_reviews
  FOR DELETE USING (auth.uid() = user_id);

-- RLS for review_media
CREATE POLICY "Anyone can view review media" ON public.review_media
  FOR SELECT USING (true);

CREATE POLICY "Review owners can add media" ON public.review_media
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.product_reviews WHERE id = review_id AND user_id = auth.uid())
  );

CREATE POLICY "Review owners can delete media" ON public.review_media
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.product_reviews WHERE id = review_id AND user_id = auth.uid())
  );

-- RLS for review_votes
CREATE POLICY "Anyone can view votes" ON public.review_votes
  FOR SELECT USING (true);

CREATE POLICY "Users can vote" ON public.review_votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own vote" ON public.review_votes
  FOR DELETE USING (auth.uid() = user_id);

-- ===============================================
-- LOYALTY POINTS SYSTEM
-- ===============================================

-- Loyalty tiers configuration
CREATE TABLE public.loyalty_tiers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  min_points INTEGER NOT NULL DEFAULT 0,
  points_multiplier NUMERIC(3,2) NOT NULL DEFAULT 1.00,
  benefits TEXT[] DEFAULT '{}',
  badge_color TEXT DEFAULT '#CD7F32',
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default tiers
INSERT INTO public.loyalty_tiers (name, min_points, points_multiplier, benefits, badge_color, display_order) VALUES
  ('Bronze', 0, 1.00, ARRAY['1 point per Rs. 100 spent', 'Birthday bonus points'], '#CD7F32', 1),
  ('Silver', 1000, 1.25, ARRAY['1.25x points multiplier', 'Early access to sales', 'Free shipping on orders over Rs. 2000'], '#C0C0C0', 2),
  ('Gold', 5000, 1.50, ARRAY['1.5x points multiplier', 'Priority customer support', 'Exclusive member discounts', 'Free shipping on all orders'], '#FFD700', 3);

-- User loyalty points balance
CREATE TABLE public.user_loyalty (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  total_points INTEGER NOT NULL DEFAULT 0,
  available_points INTEGER NOT NULL DEFAULT 0,
  pending_points INTEGER NOT NULL DEFAULT 0,
  lifetime_points INTEGER NOT NULL DEFAULT 0,
  current_tier TEXT DEFAULT 'Bronze' REFERENCES public.loyalty_tiers(name),
  signup_bonus_claimed BOOLEAN DEFAULT false,
  first_order_bonus_claimed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Points transactions history
CREATE TABLE public.points_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  points INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('earn', 'redeem', 'expire', 'adjust', 'bonus', 'refund')),
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled')),
  source TEXT NOT NULL,
  reference_id TEXT,
  description TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Loyalty rewards catalog
CREATE TABLE public.loyalty_rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  points_required INTEGER NOT NULL,
  reward_type TEXT NOT NULL CHECK (reward_type IN ('discount_percent', 'discount_fixed', 'free_shipping', 'free_product')),
  reward_value NUMERIC(10,2),
  product_id UUID REFERENCES public.products(id),
  is_active BOOLEAN DEFAULT true,
  min_order_value NUMERIC(10,2) DEFAULT 0,
  usage_limit INTEGER,
  times_redeemed INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User reward redemptions
CREATE TABLE public.reward_redemptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  reward_id UUID NOT NULL REFERENCES public.loyalty_rewards(id),
  order_id UUID REFERENCES public.orders(id),
  points_used INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired', 'cancelled')),
  code TEXT UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Loyalty system configuration
CREATE TABLE public.loyalty_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default config
INSERT INTO public.loyalty_config (key, value, description) VALUES
  ('points_per_rs', '1', 'Points earned per Rs. 100 spent'),
  ('signup_bonus', '100', 'Bonus points for new signups'),
  ('first_order_bonus', '50', 'Bonus points for first order'),
  ('review_bonus', '25', 'Bonus points for leaving a review'),
  ('referral_bonus', '100', 'Bonus points for referral'),
  ('points_expiry_months', '12', 'Points expire after this many months'),
  ('min_redeem_points', '100', 'Minimum points required to redeem'),
  ('system_enabled', 'true', 'Whether loyalty system is active');

-- Enable RLS on loyalty tables
ALTER TABLE public.loyalty_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_loyalty ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_config ENABLE ROW LEVEL SECURITY;

-- RLS policies for loyalty tables
CREATE POLICY "Anyone can view tiers" ON public.loyalty_tiers
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage tiers" ON public.loyalty_tiers
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own loyalty" ON public.user_loyalty
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert loyalty" ON public.user_loyalty
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own loyalty" ON public.user_loyalty
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own transactions" ON public.points_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert transactions" ON public.points_transactions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view active rewards" ON public.loyalty_rewards
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage rewards" ON public.loyalty_rewards
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own redemptions" ON public.reward_redemptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create redemptions" ON public.reward_redemptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own redemptions" ON public.reward_redemptions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view config" ON public.loyalty_config
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage config" ON public.loyalty_config
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- ===============================================
-- STORAGE BUCKET FOR REVIEW MEDIA
-- ===============================================
INSERT INTO storage.buckets (id, name, public) VALUES ('review-media', 'review-media', true);

-- Storage policies for review media
CREATE POLICY "Anyone can view review media" ON storage.objects
  FOR SELECT USING (bucket_id = 'review-media');

CREATE POLICY "Authenticated users can upload review media" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'review-media' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete own review media" ON storage.objects
  FOR DELETE USING (bucket_id = 'review-media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ===============================================
-- ADMIN RLS FOR ORDERS (so admins can view all orders)
-- ===============================================
CREATE POLICY "Admins can view all orders" ON public.orders
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all orders" ON public.orders
  FOR UPDATE USING (has_role(auth.uid(), 'admin'));

-- Admin can view all order items
CREATE POLICY "Admins can view all order items" ON public.order_items
  FOR SELECT USING (has_role(auth.uid(), 'admin'));