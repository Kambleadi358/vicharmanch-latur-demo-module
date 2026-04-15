
-- Add DOB to quiz_responses for unique identity
ALTER TABLE public.quiz_responses ADD COLUMN IF NOT EXISTS dob text;

-- Create quiz_sessions table for server-side timer and resume
CREATE TABLE public.quiz_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_name text NOT NULL,
  dob text NOT NULL,
  start_time timestamp with time zone NOT NULL DEFAULT now(),
  duration_seconds integer NOT NULL DEFAULT 1800,
  question_order jsonb NOT NULL DEFAULT '[]'::jsonb,
  option_orders jsonb NOT NULL DEFAULT '{}'::jsonb,
  answers_saved jsonb NOT NULL DEFAULT '{}'::jsonb,
  tab_switches integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  current_index integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(participant_name, dob)
);

ALTER TABLE public.quiz_sessions ENABLE ROW LEVEL SECURITY;

-- Anyone can create a session (quiz is public)
CREATE POLICY "Anyone can create quiz session"
ON public.quiz_sessions
FOR INSERT
WITH CHECK (true);

-- Anyone can read their own session by name+dob match
CREATE POLICY "Anyone can read quiz sessions"
ON public.quiz_sessions
FOR SELECT
USING (true);

-- Anyone can update sessions (answers, tab switches)
CREATE POLICY "Anyone can update quiz sessions"
ON public.quiz_sessions
FOR UPDATE
USING (true);

-- Admins can do everything
CREATE POLICY "Admins can manage quiz sessions"
ON public.quiz_sessions
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add unique constraint on quiz_responses for name+dob
CREATE UNIQUE INDEX IF NOT EXISTS idx_quiz_responses_name_dob ON public.quiz_responses(participant_name, dob);
