-- ============ QUIZ CONFIG (single global row) ============
CREATE TABLE public.quiz_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT 'विचारमंच प्रश्नमंजुषा',
  description text,
  status text NOT NULL DEFAULT 'UPCOMING' CHECK (status IN ('UPCOMING','ACTIVE','COMPLETED')),
  duration_seconds integer NOT NULL DEFAULT 1800,
  scheduled_start timestamptz,
  publish_answer_key boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.quiz_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view quiz config" ON public.quiz_config FOR SELECT USING (true);
CREATE POLICY "Admins manage quiz config" ON public.quiz_config FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Seed single config row
INSERT INTO public.quiz_config (title, status, duration_seconds)
VALUES ('विचारमंच प्रश्नमंजुषा', 'UPCOMING', 1800);

-- ============ QUESTIONS ============
CREATE TABLE public.quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  option_a text NOT NULL,
  option_b text NOT NULL,
  option_c text NOT NULL,
  option_d text NOT NULL,
  correct_answer text NOT NULL CHECK (correct_answer IN ('A','B','C','D')),
  marks integer NOT NULL DEFAULT 1,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;

-- Public can view questions (correct_answer is filtered out by edge function during quiz)
CREATE POLICY "Anyone can view questions" ON public.quiz_questions FOR SELECT USING (true);
CREATE POLICY "Admins manage questions" ON public.quiz_questions FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_quiz_questions_order ON public.quiz_questions(display_order);

-- ============ SESSIONS ============
CREATE TABLE public.quiz_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_name text NOT NULL,
  dob date NOT NULL,
  question_order jsonb NOT NULL DEFAULT '[]'::jsonb,
  option_orders jsonb NOT NULL DEFAULT '{}'::jsonb,
  current_index integer NOT NULL DEFAULT 0,
  start_time timestamptz NOT NULL DEFAULT now(),
  end_time timestamptz,
  duration_seconds integer NOT NULL DEFAULT 1800,
  status text NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress','submitted','auto_submitted')),
  score integer NOT NULL DEFAULT 0,
  total_marks integer NOT NULL DEFAULT 0,
  total_questions integer NOT NULL DEFAULT 0,
  time_taken_seconds integer,
  tab_switches integer NOT NULL DEFAULT 0,
  paste_attempts integer NOT NULL DEFAULT 0,
  risk_level text NOT NULL DEFAULT 'NORMAL' CHECK (risk_level IN ('NORMAL','SUSPICIOUS','HIGH_RISK')),
  risk_reasons jsonb NOT NULL DEFAULT '[]'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (participant_name, dob)
);

ALTER TABLE public.quiz_sessions ENABLE ROW LEVEL SECURITY;

-- Public read so users can fetch their own session by name+dob via edge function
CREATE POLICY "Anyone can read sessions" ON public.quiz_sessions FOR SELECT USING (true);
CREATE POLICY "Anyone can create sessions" ON public.quiz_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update sessions" ON public.quiz_sessions FOR UPDATE USING (true);
CREATE POLICY "Admins manage sessions" ON public.quiz_sessions FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_sessions_name_dob ON public.quiz_sessions(participant_name, dob);
CREATE INDEX idx_sessions_status ON public.quiz_sessions(status);
CREATE INDEX idx_sessions_score ON public.quiz_sessions(score DESC, time_taken_seconds ASC);

-- ============ ANSWERS ============
CREATE TABLE public.quiz_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.quiz_sessions(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  selected_option text CHECK (selected_option IN ('A','B','C','D')),
  is_correct boolean NOT NULL DEFAULT false,
  time_spent_seconds integer NOT NULL DEFAULT 0,
  answered_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, question_id)
);

ALTER TABLE public.quiz_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read answers" ON public.quiz_answers FOR SELECT USING (true);
CREATE POLICY "Anyone can insert answers" ON public.quiz_answers FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update answers" ON public.quiz_answers FOR UPDATE USING (true);
CREATE POLICY "Admins manage answers" ON public.quiz_answers FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_answers_session ON public.quiz_answers(session_id);
CREATE INDEX idx_answers_question ON public.quiz_answers(question_id);

-- ============ CHEATING LOGS ============
CREATE TABLE public.quiz_cheating_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.quiz_sessions(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.quiz_cheating_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert cheating logs" ON public.quiz_cheating_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins read cheating logs" ON public.quiz_cheating_logs FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_cheating_session ON public.quiz_cheating_logs(session_id);

-- ============ TIMESTAMP TRIGGERS ============
CREATE TRIGGER update_quiz_config_updated_at BEFORE UPDATE ON public.quiz_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_quiz_questions_updated_at BEFORE UPDATE ON public.quiz_questions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_quiz_sessions_updated_at BEFORE UPDATE ON public.quiz_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_quiz_answers_updated_at BEFORE UPDATE ON public.quiz_answers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ RECALCULATE SCORES (called when admin changes correct answer) ============
CREATE OR REPLACE FUNCTION public.recalculate_quiz_scores()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Recompute is_correct on every answer based on current correct_answer
  UPDATE public.quiz_answers a
  SET is_correct = (a.selected_option = q.correct_answer)
  FROM public.quiz_questions q
  WHERE a.question_id = q.id;

  -- Recompute score on every session
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
$$;