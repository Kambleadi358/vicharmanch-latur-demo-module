-- ============================================================
-- COMPETITION EVALUATION ENGINE — Schema + Storage + RLS
-- ============================================================

-- 1. competitions: links to a program
CREATE TABLE public.competitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'image',
  status text NOT NULL DEFAULT 'OPEN', -- OPEN | LOCKED (final lock)
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. competition_entries: photo + participant + category
CREATE TABLE public.competition_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id uuid NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  entry_code text NOT NULL, -- e.g. C001, M001, K001
  category text NOT NULL CHECK (category IN ('chota','motha','khula')),
  participant_name text NOT NULL,
  image_url text NOT NULL,
  image_path text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (competition_id, entry_code)
);
CREATE INDEX idx_entries_competition ON public.competition_entries(competition_id);
CREATE INDEX idx_entries_category ON public.competition_entries(competition_id, category);

-- 3. judges: custom auth (judge_id + password_hash)
CREATE TABLE public.judges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  judge_code text NOT NULL UNIQUE, -- J001, J002...
  display_name text NOT NULL,
  password_hash text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4. judge_sessions: server-side token store for multi-device login
CREATE TABLE public.judge_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  judge_id uuid NOT NULL REFERENCES public.judges(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_judge_sessions_token ON public.judge_sessions(token);

-- 5. judge_scores: one score per (judge, entry)
CREATE TABLE public.judge_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  judge_id uuid NOT NULL REFERENCES public.judges(id) ON DELETE CASCADE,
  entry_id uuid NOT NULL REFERENCES public.competition_entries(id) ON DELETE CASCADE,
  competition_id uuid NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  category text NOT NULL,
  marks numeric(4,1) NOT NULL CHECK (marks >= 0 AND marks <= 10),
  is_submitted boolean NOT NULL DEFAULT false, -- false = draft, true = locked
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (judge_id, entry_id)
);
CREATE INDEX idx_scores_competition ON public.judge_scores(competition_id);
CREATE INDEX idx_scores_judge ON public.judge_scores(judge_id);

-- 6. public_votes: 1st/2nd/3rd per category, dedup on phone+fingerprint
CREATE TABLE public.public_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id uuid NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  category text NOT NULL,
  voter_phone text NOT NULL,
  device_fingerprint text NOT NULL,
  first_entry_id uuid REFERENCES public.competition_entries(id) ON DELETE SET NULL,
  second_entry_id uuid REFERENCES public.competition_entries(id) ON DELETE SET NULL,
  third_entry_id uuid REFERENCES public.competition_entries(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (competition_id, category, voter_phone),
  UNIQUE (competition_id, category, device_fingerprint)
);
CREATE INDEX idx_votes_competition ON public.public_votes(competition_id);

-- ============================================================
-- ENABLE RLS
-- ============================================================
ALTER TABLE public.competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competition_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.judges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.judge_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.judge_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.public_votes ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- POLICIES
-- ============================================================

-- competitions: public can view visible; admin manages
CREATE POLICY "Public can view visible competitions"
ON public.competitions FOR SELECT USING (is_visible = true);
CREATE POLICY "Admins manage competitions"
ON public.competitions FOR ALL USING (has_role(auth.uid(), 'admin'));

-- entries: public read (participant_name will be hidden by app logic until LOCKED), admin manages
CREATE POLICY "Public can view entries"
ON public.competition_entries FOR SELECT USING (true);
CREATE POLICY "Admins manage entries"
ON public.competition_entries FOR ALL USING (has_role(auth.uid(), 'admin'));

-- judges: only admin can read/manage. Judge auth happens via edge function with service role.
CREATE POLICY "Admins manage judges"
ON public.judges FOR ALL USING (has_role(auth.uid(), 'admin'));

-- judge_sessions: only edge functions (service role) touch this
CREATE POLICY "Admins read judge sessions"
ON public.judge_sessions FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- judge_scores: admin reads all; judge writes via edge function (service role)
CREATE POLICY "Admins read all scores"
ON public.judge_scores FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Public can read submitted scores"
ON public.judge_scores FOR SELECT USING (is_submitted = true);

-- public_votes: insert allowed for everyone, read for admin only (privacy)
CREATE POLICY "Anyone can vote"
ON public.public_votes FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins read votes"
ON public.public_votes FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- ============================================================
-- TRIGGERS
-- ============================================================
CREATE TRIGGER update_competitions_updated_at
BEFORE UPDATE ON public.competitions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_judges_updated_at
BEFORE UPDATE ON public.judges
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_judge_scores_updated_at
BEFORE UPDATE ON public.judge_scores
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- STORAGE BUCKET
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('competition-images', 'competition-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage RLS: admin uploads, public reads
CREATE POLICY "Public can read competition images"
ON storage.objects FOR SELECT
USING (bucket_id = 'competition-images');

CREATE POLICY "Admins can upload competition images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'competition-images' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update competition images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'competition-images' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete competition images"
ON storage.objects FOR DELETE
USING (bucket_id = 'competition-images' AND has_role(auth.uid(), 'admin'));

-- ============================================================
-- HELPER: auto-generate next entry_code per competition+category
-- ============================================================
CREATE OR REPLACE FUNCTION public.next_entry_code(_competition_id uuid, _category text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  prefix text;
  max_n int;
  next_n int;
BEGIN
  prefix := CASE _category
    WHEN 'chota' THEN 'C'
    WHEN 'motha' THEN 'M'
    WHEN 'khula' THEN 'K'
    ELSE 'X'
  END;
  SELECT COALESCE(MAX(NULLIF(regexp_replace(entry_code, '[^0-9]', '', 'g'), '')::int), 0)
  INTO max_n
  FROM public.competition_entries
  WHERE competition_id = _competition_id AND category = _category;
  next_n := COALESCE(max_n, 0) + 1;
  RETURN prefix || lpad(next_n::text, 3, '0');
END;
$$;

-- ============================================================
-- HELPER: auto-generate next judge_code (J001...)
-- ============================================================
CREATE OR REPLACE FUNCTION public.next_judge_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  max_n int;
BEGIN
  SELECT COALESCE(MAX(NULLIF(regexp_replace(judge_code, '[^0-9]', '', 'g'), '')::int), 0)
  INTO max_n
  FROM public.judges;
  RETURN 'J' || lpad((COALESCE(max_n, 0) + 1)::text, 3, '0');
END;
$$;