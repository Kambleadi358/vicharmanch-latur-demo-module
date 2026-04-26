CREATE TABLE public.participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  competition_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can register as participant"
ON public.participants
FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Admins manage participants"
ON public.participants
FOR ALL
TO public
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE INDEX idx_participants_competition ON public.participants(competition_id);
CREATE INDEX idx_participants_category ON public.participants(category);
CREATE INDEX idx_participants_created_at ON public.participants(created_at DESC);

CREATE TRIGGER trg_participants_updated_at
BEFORE UPDATE ON public.participants
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();