-- ============================================================
-- V2 Module 0: Community Registry (Samaj Nondani)
-- V2 Module 1: Donation Ledger
-- ============================================================

-- Education level enum (16 fixed categories, Marathi)
CREATE TYPE public.education_level AS ENUM (
  'school_not_eligible', 'balwadi',
  'class_1','class_2','class_3','class_4','class_5','class_6',
  'class_7','class_8','class_9','class_10','class_11','class_12',
  'diploma','degree','other'
);

-- Gender enum
CREATE TYPE public.gender_type AS ENUM ('male','female','other');

-- Payment mode enum
CREATE TYPE public.payment_mode AS ENUM ('cash','online');

-- ============================================================
-- 1. households (master registry)
-- ============================================================
CREATE TABLE public.households (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  house_code SERIAL UNIQUE NOT NULL,
  head_name TEXT NOT NULL,
  head_gender public.gender_type NOT NULL,
  mobile TEXT NOT NULL,
  address TEXT,
  active_year TEXT NOT NULL DEFAULT to_char(now(), 'YYYY'),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.households TO authenticated;
GRANT ALL ON public.households TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.households_house_code_seq TO authenticated, service_role;

ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage households"
  ON public.households FOR ALL
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE INDEX idx_households_mobile ON public.households(mobile);
CREATE INDEX idx_households_active_year ON public.households(active_year);

CREATE TRIGGER trg_households_updated
  BEFORE UPDATE ON public.households
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 2. household_members
-- ============================================================
CREATE TABLE public.household_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  gender public.gender_type NOT NULL,
  education_level public.education_level NOT NULL DEFAULT 'other',
  is_head BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.household_members TO authenticated;
GRANT ALL ON public.household_members TO service_role;

ALTER TABLE public.household_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage members"
  ON public.household_members FOR ALL
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE INDEX idx_members_household ON public.household_members(household_id);
CREATE INDEX idx_members_education ON public.household_members(education_level);
CREATE INDEX idx_members_gender ON public.household_members(gender);
-- only one head per household
CREATE UNIQUE INDEX uniq_household_head ON public.household_members(household_id) WHERE is_head = true;

CREATE TRIGGER trg_members_updated
  BEFORE UPDATE ON public.household_members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create head member when household is inserted
CREATE OR REPLACE FUNCTION public.auto_create_head_member()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.household_members (household_id, name, gender, is_head, education_level)
  VALUES (NEW.id, NEW.head_name, NEW.head_gender, true, 'other');
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_household_create_head
  AFTER INSERT ON public.households
  FOR EACH ROW EXECUTE FUNCTION public.auto_create_head_member();

-- Keep head member name/gender in sync if household head info edited
CREATE OR REPLACE FUNCTION public.sync_head_member()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.head_name IS DISTINCT FROM OLD.head_name
     OR NEW.head_gender IS DISTINCT FROM OLD.head_gender THEN
    UPDATE public.household_members
      SET name = NEW.head_name, gender = NEW.head_gender, updated_at = now()
      WHERE household_id = NEW.id AND is_head = true;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_household_sync_head
  AFTER UPDATE ON public.households
  FOR EACH ROW EXECUTE FUNCTION public.sync_head_member();

-- ============================================================
-- 3. donation_payments (itemized ledger)
-- ============================================================
CREATE TABLE public.donation_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE RESTRICT,
  year TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_mode public.payment_mode NOT NULL DEFAULT 'cash',
  remark TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.donation_payments TO authenticated;
GRANT ALL ON public.donation_payments TO service_role;

ALTER TABLE public.donation_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage donation payments"
  ON public.donation_payments FOR ALL
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE INDEX idx_payments_household_year ON public.donation_payments(household_id, year);
CREATE INDEX idx_payments_year ON public.donation_payments(year);
CREATE INDEX idx_payments_date ON public.donation_payments(payment_date);

CREATE TRIGGER trg_payments_updated
  BEFORE UPDATE ON public.donation_payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 4. household_year_assignments
--    Per-year assigned (pledged) donation amount per household.
--    Lets us compute paid vs assigned vs remaining per year.
-- ============================================================
CREATE TABLE public.household_year_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  year TEXT NOT NULL,
  assigned_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (assigned_amount >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (household_id, year)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.household_year_assignments TO authenticated;
GRANT ALL ON public.household_year_assignments TO service_role;

ALTER TABLE public.household_year_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage year assignments"
  ON public.household_year_assignments FOR ALL
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE INDEX idx_assignments_year ON public.household_year_assignments(year);

CREATE TRIGGER trg_assignments_updated
  BEFORE UPDATE ON public.household_year_assignments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 5. Annual auto-promotion of education levels
-- ============================================================
CREATE OR REPLACE FUNCTION public.promote_education_levels()
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  promoted INTEGER := 0;
BEGIN
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
$$;

-- ============================================================
-- 6. Aggregate helper view for dashboard / ledger summaries
-- ============================================================
CREATE OR REPLACE VIEW public.household_donation_summary AS
SELECT
  h.id AS household_id,
  h.house_code,
  h.head_name,
  h.mobile,
  COALESCE(a.year, to_char(now(),'YYYY')) AS year,
  COALESCE(a.assigned_amount, 0) AS assigned_amount,
  COALESCE(p.paid_amount, 0) AS paid_amount,
  COALESCE(a.assigned_amount,0) - COALESCE(p.paid_amount,0) AS remaining_amount,
  CASE
    WHEN COALESCE(a.assigned_amount,0) = 0 THEN 'unassigned'
    WHEN COALESCE(p.paid_amount,0) >= a.assigned_amount THEN 'completed'
    WHEN COALESCE(p.paid_amount,0) = 0 THEN 'pending'
    ELSE 'partial'
  END AS status
FROM public.households h
LEFT JOIN public.household_year_assignments a ON a.household_id = h.id
LEFT JOIN (
  SELECT household_id, year, SUM(amount) AS paid_amount
  FROM public.donation_payments
  GROUP BY household_id, year
) p ON p.household_id = h.id AND p.year = a.year;

GRANT SELECT ON public.household_donation_summary TO authenticated, service_role;