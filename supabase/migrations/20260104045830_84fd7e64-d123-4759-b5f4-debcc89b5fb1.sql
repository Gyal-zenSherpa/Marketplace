-- Create seller applications table
CREATE TABLE public.seller_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  business_description TEXT NOT NULL,
  phone_number TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.seller_applications ENABLE ROW LEVEL SECURITY;

-- Users can view their own applications
CREATE POLICY "Users can view own application"
ON public.seller_applications
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own application
CREATE POLICY "Users can submit application"
ON public.seller_applications
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own pending application
CREATE POLICY "Users can update pending application"
ON public.seller_applications
FOR UPDATE
USING (auth.uid() = user_id AND status = 'pending');

-- Admins can view all applications
CREATE POLICY "Admins can view all applications"
ON public.seller_applications
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update any application
CREATE POLICY "Admins can update applications"
ON public.seller_applications
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_seller_applications_updated_at
BEFORE UPDATE ON public.seller_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();