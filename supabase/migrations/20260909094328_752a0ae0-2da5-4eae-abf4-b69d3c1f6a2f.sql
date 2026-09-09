-- 1. Single-vote support
ALTER TABLE public.public_votes
  ADD COLUMN IF NOT EXISTS entry_id uuid REFERENCES public.competition_entries(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS voter_name text;

UPDATE public.public_votes SET entry_id = first_entry_id WHERE entry_id IS NULL;

ALTER TABLE public.public_votes ALTER COLUMN first_entry_id DROP NOT NULL;
ALTER TABLE public.public_votes ALTER COLUMN second_entry_id DROP NOT NULL;
ALTER TABLE public.public_votes ALTER COLUMN third_entry_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_public_votes_entry ON public.public_votes(entry_id);

-- 2. Public tally function (no PII exposure)
CREATE OR REPLACE FUNCTION public.get_vote_tally(_competition_id uuid)
RETURNS TABLE (entry_id uuid, entry_code text, category text, votes bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT e.id, e.entry_code, e.category, COUNT(v.id)
  FROM public.competition_entries e
  LEFT JOIN public.public_votes v
    ON v.entry_id = e.id AND v.competition_id = e.competition_id
  WHERE e.competition_id = _competition_id
  GROUP BY e.id, e.entry_code, e.category
$$;

REVOKE ALL ON FUNCTION public.get_vote_tally(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_vote_tally(uuid) TO anon, authenticated, service_role;

-- 3. Admin cleanup routine for participation data
CREATE OR REPLACE FUNCTION public.clear_all_participation()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  n_participants int; n_entries int; n_songs int; n_votes int; n_scores int;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  DELETE FROM public.judge_scores; GET DIAGNOSTICS n_scores = ROW_COUNT;
  DELETE FROM public.public_votes; GET DIAGNOSTICS n_votes = ROW_COUNT;
  DELETE FROM public.participation_songs; GET DIAGNOSTICS n_songs = ROW_COUNT;
  DELETE FROM public.competition_entries; GET DIAGNOSTICS n_entries = ROW_COUNT;
  DELETE FROM public.participants; GET DIAGNOSTICS n_participants = ROW_COUNT;

  RETURN jsonb_build_object(
    'participants', n_participants, 'entries', n_entries,
    'songs', n_songs, 'votes', n_votes, 'scores', n_scores
  );
END;
$$;

REVOKE ALL ON FUNCTION public.clear_all_participation() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.clear_all_participation() TO authenticated, service_role;

-- 4. Admin security questions for password recovery
CREATE TABLE IF NOT EXISTS public.admin_security_questions (
  user_id uuid PRIMARY KEY,
  q1 text NOT NULL,
  a1_hash text NOT NULL,
  q2 text NOT NULL,
  a2_hash text NOT NULL,
  q3 text NOT NULL,
  a3_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_security_questions TO authenticated;
GRANT ALL ON public.admin_security_questions TO service_role;

ALTER TABLE public.admin_security_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage their own security questions"
ON public.admin_security_questions FOR ALL
TO authenticated
USING (auth.uid() = user_id AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (auth.uid() = user_id AND public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_admin_security_questions_updated_at
BEFORE UPDATE ON public.admin_security_questions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();