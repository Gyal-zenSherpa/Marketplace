
-- Revoke EXECUTE on cleanup functions from public/anon/authenticated roles
-- These should only be callable by service role (cron jobs) or admins

REVOKE EXECUTE ON FUNCTION public.cleanup_rate_limits() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_security_data() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_expired_data() FROM public, anon, authenticated;
