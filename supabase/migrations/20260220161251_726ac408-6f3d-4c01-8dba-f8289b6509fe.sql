-- Create ads table for managing advertisements
CREATE TABLE public.ads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  link_url TEXT,
  link_text TEXT DEFAULT 'Shop Now',
  position TEXT NOT NULL DEFAULT 'homepage', -- 'homepage', 'sidebar', 'below-hero'
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  bg_color TEXT DEFAULT 'from-primary to-accent',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;

-- Anyone can view active ads (public-facing feature)
CREATE POLICY "Anyone can view active ads"
ON public.ads
FOR SELECT
USING (is_active = true);

-- Only admins can manage ads
CREATE POLICY "Admins can manage ads"
ON public.ads
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_ads_updated_at
BEFORE UPDATE ON public.ads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed with a sample ad
INSERT INTO public.ads (title, description, link_url, link_text, position, display_order, bg_color)
VALUES 
  ('🔥 Mega Sale! Up to 50% Off', 'Limited time deals on top brands. Shop before stock runs out!', '/', 'Shop Deals', 'homepage', 1, 'from-primary to-accent'),
  ('🎉 New Arrivals This Week', 'Fresh drops from your favorite brands. Be the first to grab them!', '/', 'Explore Now', 'below-hero', 2, 'from-accent to-primary');
