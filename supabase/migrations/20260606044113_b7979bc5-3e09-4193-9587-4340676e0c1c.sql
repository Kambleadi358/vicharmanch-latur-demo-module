
-- 1) Cascade delete for donation_payments when household deleted
ALTER TABLE public.donation_payments
  DROP CONSTRAINT IF EXISTS donation_payments_household_id_fkey;
ALTER TABLE public.donation_payments
  ADD CONSTRAINT donation_payments_household_id_fkey
  FOREIGN KEY (household_id) REFERENCES public.households(id) ON DELETE CASCADE;

-- 2) Vote uniqueness: per (competition, category) instead of per competition
DROP INDEX IF EXISTS public.public_votes_one_per_program_fp;
DROP INDEX IF EXISTS public.public_votes_one_per_program_phone;
CREATE UNIQUE INDEX public_votes_one_per_cat_fp
  ON public.public_votes (competition_id, category, device_fingerprint);
CREATE UNIQUE INDEX public_votes_one_per_cat_phone
  ON public.public_votes (competition_id, category, voter_phone);

-- 3) Public can read aggregate vote rows (no PII columns selected on client)
DROP POLICY IF EXISTS "Public read votes" ON public.public_votes;
CREATE POLICY "Public read votes" ON public.public_votes
  FOR SELECT TO anon, authenticated USING (true);
GRANT SELECT ON public.public_votes TO anon;
