
ALTER TABLE public.participants
  ADD COLUMN IF NOT EXISTS household_member_id uuid REFERENCES public.household_members(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_participants_member ON public.participants(household_member_id);

-- Prevent duplicate registration (per competition per registry member)
CREATE UNIQUE INDEX IF NOT EXISTS uniq_participant_member_competition
  ON public.participants(competition_id, household_member_id)
  WHERE household_member_id IS NOT NULL AND is_archived = false;

-- Failed search log
CREATE TABLE IF NOT EXISTS public.failed_participation_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entered_name text NOT NULL,
  competition_id uuid REFERENCES public.competitions(id) ON DELETE SET NULL,
  competition_name text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, DELETE ON public.failed_participation_searches TO authenticated;
GRANT INSERT ON public.failed_participation_searches TO anon;
GRANT ALL ON public.failed_participation_searches TO service_role;

ALTER TABLE public.failed_participation_searches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can log a missing name"
  ON public.failed_participation_searches FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins manage missing-name log"
  ON public.failed_participation_searches FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Storage: admins manage participation songs + archives buckets
CREATE POLICY "Admins read participation songs"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'participation-songs' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage participation songs"
  ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'participation-songs' AND has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (bucket_id = 'participation-songs' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public can upload participation songs"
  ON storage.objects FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'participation-songs');

CREATE POLICY "Admins manage archives"
  ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'archives' AND has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (bucket_id = 'archives' AND has_role(auth.uid(), 'admin'::app_role));
