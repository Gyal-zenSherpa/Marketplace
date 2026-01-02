-- Create wishlists table
CREATE TABLE public.wishlists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- Enable Row Level Security
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for wishlists
CREATE POLICY "Users can view own wishlist" 
ON public.wishlists 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can add to own wishlist" 
ON public.wishlists 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove from own wishlist" 
ON public.wishlists 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create browsing history table
CREATE TABLE public.browsing_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  view_count INTEGER NOT NULL DEFAULT 1
);

-- Enable Row Level Security
ALTER TABLE public.browsing_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for browsing history
CREATE POLICY "Users can view own browsing history" 
ON public.browsing_history 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can add to own browsing history" 
ON public.browsing_history 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own browsing history" 
ON public.browsing_history 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own browsing history" 
ON public.browsing_history 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_wishlists_user_id ON public.wishlists(user_id);
CREATE INDEX idx_browsing_history_user_id ON public.browsing_history(user_id);
CREATE INDEX idx_browsing_history_user_product ON public.browsing_history(user_id, product_id);