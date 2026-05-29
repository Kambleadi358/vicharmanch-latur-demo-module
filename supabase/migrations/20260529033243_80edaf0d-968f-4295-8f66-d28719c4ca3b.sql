
-- 1) Prevent duplicate active quiz sessions per (name, dob)
CREATE UNIQUE INDEX IF NOT EXISTS uq_quiz_sessions_active_participant
  ON public.quiz_sessions (lower(trim(participant_name)), dob)
  WHERE status = 'in_progress';

-- 2) Prevent multiple submitted sessions per participant
CREATE UNIQUE INDEX IF NOT EXISTS uq_quiz_sessions_submitted_participant
  ON public.quiz_sessions (lower(trim(participant_name)), dob)
  WHERE status IN ('submitted','auto_submitted');

-- 3) Prevent duplicate answer rows per (session, question)
CREATE UNIQUE INDEX IF NOT EXISTS uq_quiz_answers_session_question
  ON public.quiz_answers (session_id, question_id);

-- 4) Hot-path indexes
CREATE INDEX IF NOT EXISTS idx_quiz_answers_session ON public.quiz_answers (session_id);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_status ON public.quiz_sessions (status);
CREATE INDEX IF NOT EXISTS idx_public_votes_comp_cat ON public.public_votes (competition_id, category);
CREATE INDEX IF NOT EXISTS idx_competition_entries_comp_cat ON public.competition_entries (competition_id, category);
CREATE INDEX IF NOT EXISTS idx_judge_scores_comp_cat ON public.judge_scores (competition_id, category);
CREATE INDEX IF NOT EXISTS idx_home_donations_home_year ON public.home_donations (home_id, year);
CREATE INDEX IF NOT EXISTS idx_account_expenses_account ON public.account_expenses (account_id);
CREATE INDEX IF NOT EXISTS idx_annual_reports_year ON public.annual_reports (year DESC);
CREATE INDEX IF NOT EXISTS idx_programs_date ON public.programs (date);
CREATE INDEX IF NOT EXISTS idx_judge_sessions_token ON public.judge_sessions (token);

-- 5) updated_at triggers (function already exists)
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'quiz_sessions','quiz_answers','quiz_questions','quiz_config',
    'home_donations','homes','yearly_accounts','programs','notices',
    'judge_scores','judges','annual_reports','competitions','competition_entries',
    'program_winners','site_settings'
  ] LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS trg_%1$s_set_updated_at ON public.%1$s;
       CREATE TRIGGER trg_%1$s_set_updated_at
         BEFORE UPDATE ON public.%1$s
         FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();', t);
  END LOOP;
END $$;
