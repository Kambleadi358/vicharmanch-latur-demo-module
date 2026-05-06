
-- 1) Fix program_winners.category check constraint to allow free-form labels (we use "<comp> – छोटा गट" etc.)
ALTER TABLE public.program_winners DROP CONSTRAINT IF EXISTS program_winners_category_check;

-- 2) Allow public to vote multiple times per program: drop unique constraints on phone/fingerprint per category.
ALTER TABLE public.public_votes DROP CONSTRAINT IF EXISTS public_votes_competition_id_category_voter_phone_key;
ALTER TABLE public.public_votes DROP CONSTRAINT IF EXISTS public_votes_competition_id_category_device_fingerprint_key;
ALTER TABLE public.public_votes DROP CONSTRAINT IF EXISTS public_votes_phone_unique;
ALTER TABLE public.public_votes DROP CONSTRAINT IF EXISTS public_votes_fp_unique;

-- Replace with one-vote-per-program (across all categories): allow vote per program once per phone & per fingerprint
CREATE UNIQUE INDEX IF NOT EXISTS public_votes_one_per_program_phone
  ON public.public_votes (competition_id, voter_phone);
CREATE UNIQUE INDEX IF NOT EXISTS public_votes_one_per_program_fp
  ON public.public_votes (competition_id, device_fingerprint);
