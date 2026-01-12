-- Create terms_agreements table to track user T&C acceptances
CREATE TABLE public.terms_agreements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  version VARCHAR(50) NOT NULL DEFAULT '1.0',
  ip_address VARCHAR(45),
  user_agent TEXT,
  agreed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.terms_agreements ENABLE ROW LEVEL SECURITY;

-- Users can view their own agreements
CREATE POLICY "Users can view their own agreements" 
ON public.terms_agreements 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can create their own agreements
CREATE POLICY "Users can create their own agreements" 
ON public.terms_agreements 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Admins can view all agreements
CREATE POLICY "Admins can view all agreements" 
ON public.terms_agreements 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

-- Create referrals table
CREATE TABLE public.referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL,
  referred_email VARCHAR(255) NOT NULL,
  referral_code VARCHAR(20) NOT NULL UNIQUE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  referred_user_id UUID,
  points_awarded INTEGER DEFAULT 0,
  first_purchase_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Users can view referrals they created
CREATE POLICY "Users can view their referrals" 
ON public.referrals 
FOR SELECT 
USING (auth.uid() = referrer_id);

-- Users can create referrals
CREATE POLICY "Users can create referrals" 
ON public.referrals 
FOR INSERT 
WITH CHECK (auth.uid() = referrer_id);

-- Users can update their referrals
CREATE POLICY "Users can update their referrals" 
ON public.referrals 
FOR UPDATE 
USING (auth.uid() = referrer_id);

-- Admins can view all referrals
CREATE POLICY "Admins can view all referrals" 
ON public.referrals 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

-- Add referral_code column to profiles for users to share their code
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_code VARCHAR(20) UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referred_by UUID;

-- Create trigger for updated_at on referrals
CREATE TRIGGER update_referrals_updated_at
BEFORE UPDATE ON public.referrals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for referral lookups
CREATE INDEX idx_referrals_code ON public.referrals(referral_code);
CREATE INDEX idx_referrals_referrer ON public.referrals(referrer_id);
CREATE INDEX idx_profiles_referral_code ON public.profiles(referral_code);