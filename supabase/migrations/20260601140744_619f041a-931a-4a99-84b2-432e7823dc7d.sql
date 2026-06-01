DROP POLICY IF EXISTS "Anyone can view votes" ON public.review_votes;
CREATE POLICY "Users can view own votes" ON public.review_votes FOR SELECT TO authenticated USING (auth.uid() = user_id);