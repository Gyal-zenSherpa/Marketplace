
-- Table for storing customer-reported issues (viewable in admin panel)
CREATE TABLE public.customer_issues (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  category TEXT NOT NULL,
  order_number TEXT,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.customer_issues ENABLE ROW LEVEL SECURITY;

-- Anyone can submit an issue (even non-logged-in users)
CREATE POLICY "Anyone can submit issues"
ON public.customer_issues
FOR INSERT
WITH CHECK (true);

-- Users can view their own issues
CREATE POLICY "Users can view own issues"
ON public.customer_issues
FOR SELECT
USING (auth.uid() = user_id OR auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'));

-- Admins can update issues
CREATE POLICY "Admins can update issues"
ON public.customer_issues
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_customer_issues_updated_at
BEFORE UPDATE ON public.customer_issues
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Table for user notifications/messages
CREATE TABLE public.user_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  is_read BOOLEAN NOT NULL DEFAULT false,
  link TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
ON public.user_notifications
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
ON public.user_notifications
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
ON public.user_notifications
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can delete own notifications"
ON public.user_notifications
FOR DELETE
USING (auth.uid() = user_id);
