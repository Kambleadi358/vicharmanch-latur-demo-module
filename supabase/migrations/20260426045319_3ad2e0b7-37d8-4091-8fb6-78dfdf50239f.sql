-- Hot-path indexes for Competition Evaluation Engine
CREATE INDEX IF NOT EXISTS idx_judge_sessions_token ON public.judge_sessions(token);
CREATE INDEX IF NOT EXISTS idx_judge_sessions_judge_expires ON public.judge_sessions(judge_id, expires_at);

CREATE INDEX IF NOT EXISTS idx_judge_scores_judge_entry ON public.judge_scores(judge_id, entry_id);
CREATE INDEX IF NOT EXISTS idx_judge_scores_comp_cat ON public.judge_scores(competition_id, category);
CREATE INDEX IF NOT EXISTS idx_judge_scores_judge_comp_cat ON public.judge_scores(judge_id, competition_id, category);
CREATE INDEX IF NOT EXISTS idx_judge_scores_updated_at ON public.judge_scores(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_entries_comp_cat ON public.competition_entries(competition_id, category);
CREATE INDEX IF NOT EXISTS idx_entries_comp_created ON public.competition_entries(competition_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_competitions_visible_created ON public.competitions(is_visible, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_votes_comp_cat ON public.public_votes(competition_id, category);
CREATE INDEX IF NOT EXISTS idx_votes_phone ON public.public_votes(competition_id, category, voter_phone);
CREATE INDEX IF NOT EXISTS idx_votes_fp ON public.public_votes(competition_id, category, device_fingerprint);

-- Unique upsert key for judge_scores (used by upsert onConflict=judge_id,entry_id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'judge_scores_judge_entry_key'
  ) THEN
    ALTER TABLE public.judge_scores
      ADD CONSTRAINT judge_scores_judge_entry_key UNIQUE (judge_id, entry_id);
  END IF;
END$$;

-- Prevent duplicate votes by phone or fingerprint per (competition, category)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'public_votes_phone_unique'
  ) THEN
    ALTER TABLE public.public_votes
      ADD CONSTRAINT public_votes_phone_unique UNIQUE (competition_id, category, voter_phone);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'public_votes_fp_unique'
  ) THEN
    ALTER TABLE public.public_votes
      ADD CONSTRAINT public_votes_fp_unique UNIQUE (competition_id, category, device_fingerprint);
  END IF;
END$$;

-- Allow judges to insert/update their own scores via service role (already done in edge fn);
-- but RLS for direct admin reads stays as-is. We add an updated_at trigger on judge_scores
-- and competition_entries so client polling can do incremental sync.
DROP TRIGGER IF EXISTS trg_judge_scores_updated ON public.judge_scores;
CREATE TRIGGER trg_judge_scores_updated
  BEFORE UPDATE ON public.judge_scores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_competitions_updated ON public.competitions;
CREATE TRIGGER trg_competitions_updated
  BEFORE UPDATE ON public.competitions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();