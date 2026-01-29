-- Create homes table for donation tracking
CREATE TABLE public.homes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  home_number INTEGER NOT NULL,
  home_name TEXT,
  address TEXT,
  contact_person TEXT,
  contact_phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create donations table to track yearly donations per home
CREATE TABLE public.home_donations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id UUID NOT NULL REFERENCES public.homes(id) ON DELETE CASCADE,
  year TEXT NOT NULL,
  assigned_amount NUMERIC NOT NULL DEFAULT 0,
  paid_amount NUMERIC NOT NULL DEFAULT 0,
  payment_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(home_id, year)
);

-- Enable RLS on homes
ALTER TABLE public.homes ENABLE ROW LEVEL SECURITY;

-- Enable RLS on home_donations
ALTER TABLE public.home_donations ENABLE ROW LEVEL SECURITY;

-- RLS policies for homes - admins can manage, public can view
CREATE POLICY "Admins can manage homes"
ON public.homes FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Public can view homes"
ON public.homes FOR SELECT
USING (true);

-- RLS policies for home_donations - admins can manage, public can view
CREATE POLICY "Admins can manage donations"
ON public.home_donations FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Public can view donations"
ON public.home_donations FOR SELECT
USING (true);

-- Trigger for updated_at on homes
CREATE TRIGGER update_homes_updated_at
BEFORE UPDATE ON public.homes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for updated_at on home_donations
CREATE TRIGGER update_home_donations_updated_at
BEFORE UPDATE ON public.home_donations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert 50 sample homes
INSERT INTO public.homes (home_number, home_name) VALUES
(1, 'घर क्र. १'), (2, 'घर क्र. २'), (3, 'घर क्र. ३'), (4, 'घर क्र. ४'), (5, 'घर क्र. ५'),
(6, 'घर क्र. ६'), (7, 'घर क्र. ७'), (8, 'घर क्र. ८'), (9, 'घर क्र. ९'), (10, 'घर क्र. १०'),
(11, 'घर क्र. ११'), (12, 'घर क्र. १२'), (13, 'घर क्र. १३'), (14, 'घर क्र. १४'), (15, 'घर क्र. १५'),
(16, 'घर क्र. १६'), (17, 'घर क्र. १७'), (18, 'घर क्र. १८'), (19, 'घर क्र. १९'), (20, 'घर क्र. २०'),
(21, 'घर क्र. २१'), (22, 'घर क्र. २२'), (23, 'घर क्र. २३'), (24, 'घर क्र. २४'), (25, 'घर क्र. २५'),
(26, 'घर क्र. २६'), (27, 'घर क्र. २७'), (28, 'घर क्र. २८'), (29, 'घर क्र. २९'), (30, 'घर क्र. ३०'),
(31, 'घर क्र. ३१'), (32, 'घर क्र. ३२'), (33, 'घर क्र. ३३'), (34, 'घर क्र. ३४'), (35, 'घर क्र. ३५'),
(36, 'घर क्र. ३६'), (37, 'घर क्र. ३७'), (38, 'घर क्र. ३८'), (39, 'घर क्र. ३९'), (40, 'घर क्र. ४०'),
(41, 'घर क्र. ४१'), (42, 'घर क्र. ४२'), (43, 'घर क्र. ४३'), (44, 'घर क्र. ४४'), (45, 'घर क्र. ४५'),
(46, 'घर क्र. ४६'), (47, 'घर क्र. ४७'), (48, 'घर क्र. ४८'), (49, 'घर क्र. ४९'), (50, 'घर क्र. ५०');