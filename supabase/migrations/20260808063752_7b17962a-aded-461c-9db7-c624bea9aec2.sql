-- 1. public_votes: remove public read of PII, expose safe view
DROP POLICY IF EXISTS "Public read votes" ON public.public_votes;

CREATE OR REPLACE VIEW public.public_vote_choices AS
SELECT id, competition_id, category, first_entry_id, second_entry_id, third_entry_id, created_at
FROM public.public_votes;
GRANT SELECT ON public.public_vote_choices TO anon, authenticated;

-- 2. quiz_sessions / quiz_answers: no public read/write (edge functions use service role)
DROP POLICY IF EXISTS "Anyone can read sessions" ON public.quiz_sessions;
DROP POLICY IF EXISTS "Anyone can update sessions" ON public.quiz_sessions;
DROP POLICY IF EXISTS "Anyone can create sessions" ON public.quiz_sessions;
DROP POLICY IF EXISTS "Anyone can read answers" ON public.quiz_answers;
DROP POLICY IF EXISTS "Anyone can update answers" ON public.quiz_answers;
DROP POLICY IF EXISTS "Anyone can insert answers" ON public.quiz_answers;

-- 3. archives: hide created_by / created_by_email from public
DROP POLICY IF EXISTS "Anyone can view archives" ON public.archives;
CREATE POLICY "Admins read archives" ON public.archives
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE VIEW public.archives_public AS
SELECT id, year, archive_date, remark, summary, created_at
FROM public.archives;
GRANT SELECT ON public.archives_public TO anon, authenticated;

-- 4. judge_scores: admin-only reads
DROP POLICY IF EXISTS "Public can read submitted scores" ON public.judge_scores;

-- 5. participation_songs: validate participant exists and is active
DROP POLICY IF EXISTS "Anyone can attach song to own participation" ON public.participation_songs;
CREATE POLICY "Songs attach to a real participant" ON public.participation_songs
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.participants p
      WHERE p.id = participation_songs.participant_id
        AND p.is_archived = false
    )
    AND length(file_path) BETWEEN 1 AND 512
    AND length(original_filename) BETWEEN 1 AND 255
    AND is_archived = false
  );

-- 6. failed_participation_searches: validate input
DROP POLICY IF EXISTS "Anyone can log a missing name" ON public.failed_participation_searches;
CREATE POLICY "Anyone can log a missing name" ON public.failed_participation_searches
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    length(entered_name) BETWEEN 1 AND 120
    AND (competition_name IS NULL OR length(competition_name) <= 200)
    AND (user_agent IS NULL OR length(user_agent) <= 512)
  );

-- 7. storage: restrict song uploads, drop bucket listing policies
DROP POLICY IF EXISTS "Anyone can upload songs" ON storage.objects;
DROP POLICY IF EXISTS "Public can upload participation songs" ON storage.objects;
CREATE POLICY "Participants upload songs into valid path" ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    bucket_id = 'participation-songs'
    AND (storage.foldername(name))[1] IS NOT NULL
    AND length(name) BETWEEN 5 AND 400
    AND lower(right(name, 5)) IN ('.mp3x', '.mp3', '.wav', '.m4a', '.aac', '.ogg')
  );

DROP POLICY IF EXISTS "Public can read competition images" ON storage.objects;
DROP POLICY IF EXISTS "Public can read annual report pdfs" ON storage.objects;

-- 8. functions: admin checks + revoke public execute + search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.promote_education_levels()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  promoted INTEGER := 0;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  UPDATE public.household_members
  SET education_level = CASE education_level
    WHEN 'school_not_eligible' THEN 'balwadi'::education_level
    WHEN 'balwadi'  THEN 'class_1'::education_level
    WHEN 'class_1'  THEN 'class_2'::education_level
    WHEN 'class_2'  THEN 'class_3'::education_level
    WHEN 'class_3'  THEN 'class_4'::education_level
    WHEN 'class_4'  THEN 'class_5'::education_level
    WHEN 'class_5'  THEN 'class_6'::education_level
    WHEN 'class_6'  THEN 'class_7'::education_level
    WHEN 'class_7'  THEN 'class_8'::education_level
    WHEN 'class_8'  THEN 'class_9'::education_level
    WHEN 'class_9'  THEN 'class_10'::education_level
    WHEN 'class_10' THEN 'class_11'::education_level
    WHEN 'class_11' THEN 'class_12'::education_level
    WHEN 'class_12' THEN 'diploma'::education_level
    WHEN 'diploma'  THEN 'degree'::education_level
    WHEN 'degree'   THEN 'other'::education_level
    ELSE education_level
  END,
  updated_at = now()
  WHERE education_level NOT IN ('other');
  GET DIAGNOSTICS promoted = ROW_COUNT;
  RETURN promoted;
END;
$function$;

CREATE OR REPLACE FUNCTION public.recalculate_quiz_scores()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  UPDATE public.quiz_answers a
  SET is_correct = (a.selected_option = q.correct_answer)
  FROM public.quiz_questions q
  WHERE a.question_id = q.id;

  UPDATE public.quiz_sessions s
  SET score = COALESCE(sub.total_score, 0)
  FROM (
    SELECT a.session_id, SUM(CASE WHEN a.is_correct THEN q.marks ELSE 0 END) AS total_score
    FROM public.quiz_answers a
    JOIN public.quiz_questions q ON q.id = a.question_id
    GROUP BY a.session_id
  ) sub
  WHERE s.id = sub.session_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.next_entry_code(_competition_id uuid, _category text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  prefix text;
  max_n int;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
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
  RETURN prefix || lpad((COALESCE(max_n, 0) + 1)::text, 3, '0');
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.next_judge_code() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.promote_education_levels() FROM anon;
REVOKE EXECUTE ON FUNCTION public.recalculate_quiz_scores() FROM anon;
REVOKE EXECUTE ON FUNCTION public.next_entry_code(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.auto_create_competition_for_program() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.auto_create_head_member() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_head_member() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_competition_with_program() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_archive_readonly() FROM anon, authenticated;