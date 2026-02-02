-- Create table to store individual quiz answers
CREATE TABLE public.quiz_answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  response_id UUID NOT NULL REFERENCES public.quiz_responses(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  selected_answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.quiz_answers ENABLE ROW LEVEL SECURITY;

-- Admins can manage answers
CREATE POLICY "Admins can manage quiz answers"
ON public.quiz_answers
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Public can insert answers (when submitting quiz)
CREATE POLICY "Public can insert quiz answers"
ON public.quiz_answers
FOR INSERT
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_quiz_answers_response_id ON public.quiz_answers(response_id);