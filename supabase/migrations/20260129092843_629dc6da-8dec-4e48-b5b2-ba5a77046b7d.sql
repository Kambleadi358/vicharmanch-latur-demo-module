-- Create programs table
CREATE TABLE public.programs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  location TEXT,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'completed')),
  description TEXT,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create program winners table for class-wise winners
CREATE TABLE public.program_winners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('छोटा गट', 'मोठा गट', 'खुला गट')),
  first_place TEXT,
  second_place TEXT,
  third_place TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(program_id, category)
);

-- Enable RLS
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_winners ENABLE ROW LEVEL SECURITY;

-- RLS policies for programs
CREATE POLICY "Public can view visible programs" 
ON public.programs 
FOR SELECT 
USING (is_visible = true);

CREATE POLICY "Admins can manage programs" 
ON public.programs 
FOR ALL 
USING (has_role(auth.uid(), 'admin'));

-- RLS policies for program_winners
CREATE POLICY "Public can view winners" 
ON public.program_winners 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.programs 
  WHERE programs.id = program_winners.program_id 
  AND programs.is_visible = true
));

CREATE POLICY "Admins can manage winners" 
ON public.program_winners 
FOR ALL 
USING (has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_programs_updated_at
BEFORE UPDATE ON public.programs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_program_winners_updated_at
BEFORE UPDATE ON public.program_winners
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();