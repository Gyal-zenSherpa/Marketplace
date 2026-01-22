-- Create data retention cleanup function
CREATE OR REPLACE FUNCTION public.cleanup_expired_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete rate limits older than 1 hour
  DELETE FROM public.rate_limits
  WHERE window_start < now() - interval '1 hour';
  
  -- Delete failed login attempts older than 30 days
  DELETE FROM public.failed_login_attempts
  WHERE created_at < now() - interval '30 days';
  
  -- Delete security audit logs older than 90 days
  DELETE FROM public.security_audit_log
  WHERE created_at < now() - interval '90 days';
  
  -- Delete expired points transactions older than 1 year
  DELETE FROM public.points_transactions
  WHERE expires_at IS NOT NULL 
    AND expires_at < now() - interval '1 year'
    AND status = 'expired';
END;
$$;

-- Create extension for scheduling if not exists
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the cleanup to run daily at 3 AM UTC
SELECT cron.schedule(
  'daily-data-cleanup',
  '0 3 * * *',
  'SELECT public.cleanup_expired_data();'
);