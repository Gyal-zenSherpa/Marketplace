-- Fix RLS on rate_limits and failed_login_attempts tables

-- Enable RLS on rate_limits
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Rate limits should only be accessible by service role (edge functions)
CREATE POLICY "Service role only for rate_limits"
ON public.rate_limits
FOR ALL
USING (false)
WITH CHECK (false);

-- Enable RLS on failed_login_attempts
ALTER TABLE public.failed_login_attempts ENABLE ROW LEVEL SECURITY;

-- Failed login attempts should only be accessible by service role
CREATE POLICY "Service role only for failed_login_attempts"
ON public.failed_login_attempts
FOR ALL
USING (false)
WITH CHECK (false);