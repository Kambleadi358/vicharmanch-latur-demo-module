
-- 1. Auto-create a competition when a program is inserted
CREATE OR REPLACE FUNCTION public.auto_create_competition_for_program()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only create one competition per program; reuse program id as competition.program_id link
  IF NOT EXISTS (SELECT 1 FROM public.competitions WHERE program_id = NEW.id) THEN
    INSERT INTO public.competitions (program_id, name, type, status, is_visible)
    VALUES (NEW.id, NEW.name, 'image', 'OPEN', COALESCE(NEW.is_visible, true));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_create_competition ON public.programs;
CREATE TRIGGER trg_auto_create_competition
AFTER INSERT ON public.programs
FOR EACH ROW
EXECUTE FUNCTION public.auto_create_competition_for_program();

-- 2. Sync name + visibility when program updates
CREATE OR REPLACE FUNCTION public.sync_competition_with_program()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.competitions
  SET name = NEW.name,
      is_visible = COALESCE(NEW.is_visible, true),
      updated_at = now()
  WHERE program_id = NEW.id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_competition ON public.programs;
CREATE TRIGGER trg_sync_competition
AFTER UPDATE OF name, is_visible ON public.programs
FOR EACH ROW
EXECUTE FUNCTION public.sync_competition_with_program();

-- 3. Backfill: ensure every existing program has a competition
INSERT INTO public.competitions (program_id, name, type, status, is_visible)
SELECT p.id, p.name, 'image', 'OPEN', COALESCE(p.is_visible, true)
FROM public.programs p
WHERE NOT EXISTS (SELECT 1 FROM public.competitions c WHERE c.program_id = p.id);

-- 4. Performance indexes for hundreds of records
CREATE INDEX IF NOT EXISTS idx_participants_competition_id
  ON public.participants(competition_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_participants_category
  ON public.participants(category);
CREATE INDEX IF NOT EXISTS idx_judges_competition_id
  ON public.judges(competition_id);
CREATE INDEX IF NOT EXISTS idx_judges_judge_code
  ON public.judges(judge_code);
CREATE INDEX IF NOT EXISTS idx_competition_entries_comp_cat
  ON public.competition_entries(competition_id, category, created_at);
CREATE INDEX IF NOT EXISTS idx_judge_scores_comp_judge
  ON public.judge_scores(competition_id, judge_id);
CREATE INDEX IF NOT EXISTS idx_judge_scores_entry
  ON public.judge_scores(entry_id);
CREATE INDEX IF NOT EXISTS idx_judge_sessions_token
  ON public.judge_sessions(token);
CREATE INDEX IF NOT EXISTS idx_competitions_program_id
  ON public.competitions(program_id);

-- 5. Add judge_passwords table to securely store recoverable plain passwords
-- (admin-only access via RLS) so admins can re-view credentials anytime.
CREATE TABLE IF NOT EXISTS public.judge_passwords (
  judge_id uuid PRIMARY KEY,
  plain_password text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.judge_passwords ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage judge passwords" ON public.judge_passwords;
CREATE POLICY "Admins manage judge passwords"
ON public.judge_passwords
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
