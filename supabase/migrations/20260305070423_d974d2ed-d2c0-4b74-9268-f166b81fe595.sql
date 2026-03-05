
-- Add show_on_ui to program_winners
ALTER TABLE public.program_winners ADD COLUMN IF NOT EXISTS show_on_ui boolean NOT NULL DEFAULT true;

-- Create prize_items table
CREATE TABLE public.prize_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_name text NOT NULL,
  quantity integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.prize_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage prize items" ON public.prize_items FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Public can view prize items" ON public.prize_items FOR SELECT TO anon, authenticated USING (true);

-- Create prize_allocations table
CREATE TABLE public.prize_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  prize_item_id uuid NOT NULL REFERENCES public.prize_items(id) ON DELETE CASCADE,
  group_name text NOT NULL,
  winner_name text NOT NULL,
  rank text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.prize_allocations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage prize allocations" ON public.prize_allocations FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Public can view prize allocations" ON public.prize_allocations FOR SELECT TO anon, authenticated USING (true);
