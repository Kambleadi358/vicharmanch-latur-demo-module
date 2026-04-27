ALTER TABLE public.judges
  ADD COLUMN IF NOT EXISTS competition_id uuid;

CREATE INDEX IF NOT EXISTS idx_judges_competition_id
  ON public.judges (competition_id);