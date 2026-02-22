
-- Fix: Tighten customer_issues INSERT to require at least name and email
DROP POLICY "Anyone can submit issues" ON public.customer_issues;
CREATE POLICY "Anyone can submit issues"
ON public.customer_issues
FOR INSERT
WITH CHECK (
  length(trim(name)) > 0 AND
  length(trim(email)) > 0 AND
  length(trim(description)) > 0
);

-- Fix: Tighten notifications INSERT to only allow for authenticated users
DROP POLICY "System can insert notifications" ON public.user_notifications;
CREATE POLICY "Authenticated can insert notifications"
ON public.user_notifications
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);
