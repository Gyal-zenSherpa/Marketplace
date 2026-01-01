-- Create table to store admin TOTP secrets for 2FA
CREATE TABLE public.admin_totp_secrets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  encrypted_secret TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  backup_codes TEXT[] DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_totp_secrets ENABLE ROW LEVEL SECURITY;

-- Only the user themselves can view their TOTP settings
CREATE POLICY "Users can view own TOTP settings"
ON public.admin_totp_secrets
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Only admins can insert their own TOTP settings
CREATE POLICY "Admins can insert own TOTP settings"
ON public.admin_totp_secrets
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  AND has_role(auth.uid(), 'admin')
);

-- Only admins can update their own TOTP settings
CREATE POLICY "Admins can update own TOTP settings"
ON public.admin_totp_secrets
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id 
  AND has_role(auth.uid(), 'admin')
);

-- Trigger for updated_at
CREATE TRIGGER update_admin_totp_secrets_updated_at
BEFORE UPDATE ON public.admin_totp_secrets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();