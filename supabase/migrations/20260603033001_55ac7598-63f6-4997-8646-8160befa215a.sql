
-- ====== V2 Phase 0: Schema for Modules 2,3,4,5,6,7 ======

-- Enums
CREATE TYPE public.suggestion_category AS ENUM ('suggestion','complaint','feedback','other');
CREATE TYPE public.suggestion_status AS ENUM ('new','accepted','rejected','resolved');

-- =========== Module 3: Suggestions ===========
CREATE TABLE public.suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  mobile text,
  category public.suggestion_category NOT NULL DEFAULT 'suggestion',
  message text NOT NULL,
  status public.suggestion_status NOT NULL DEFAULT 'new',
  is_anonymous boolean NOT NULL DEFAULT false,
  admin_response text,
  resolved_at timestamptz,
  is_archived boolean NOT NULL DEFAULT false,
  archived_year text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.suggestions TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.suggestions TO authenticated;
GRANT ALL ON public.suggestions TO service_role;
ALTER TABLE public.suggestions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit suggestions" ON public.suggestions
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins manage suggestions" ON public.suggestions
  FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_suggestions_updated BEFORE UPDATE ON public.suggestions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========== Module 5: Admin Activity Logs ===========
CREATE TABLE public.admin_activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid,
  actor_email text,
  action text NOT NULL,
  entity_type text,
  entity_id text,
  details jsonb,
  ip text,
  user_agent text,
  is_archived boolean NOT NULL DEFAULT false,
  archived_year text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.admin_activity_logs TO authenticated;
GRANT SELECT ON public.admin_activity_logs TO authenticated;
GRANT ALL ON public.admin_activity_logs TO service_role;
ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can insert own activity" ON public.admin_activity_logs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = actor_user_id);
CREATE POLICY "Admins read activity logs" ON public.admin_activity_logs
  FOR SELECT TO authenticated USING (has_role(auth.uid(),'admin'));

-- =========== Module 7: App Settings ===========
CREATE TABLE public.app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section text NOT NULL,
  key text NOT NULL,
  value jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(section, key)
);
GRANT SELECT ON public.app_settings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.app_settings TO authenticated;
GRANT ALL ON public.app_settings TO service_role;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view app settings" ON public.app_settings FOR SELECT USING (true);
CREATE POLICY "Admins manage app settings" ON public.app_settings
  FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_app_settings_updated BEFORE UPDATE ON public.app_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default settings
INSERT INTO public.app_settings (section, key, value) VALUES
  ('event','active_year', to_jsonb(to_char(now(),'YYYY'))),
  ('event','suggestions_anonymous_enabled', to_jsonb(true)),
  ('notification','sms_provider', to_jsonb('disabled'::text)),
  ('notification','email_provider', to_jsonb('disabled'::text))
ON CONFLICT DO NOTHING;

-- =========== Module 4: Participation Songs ===========
CREATE TABLE public.participation_songs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id uuid NOT NULL,
  file_path text NOT NULL,
  original_filename text NOT NULL,
  mime text,
  size_bytes bigint,
  is_archived boolean NOT NULL DEFAULT false,
  archived_year text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.participation_songs TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.participation_songs TO authenticated;
GRANT ALL ON public.participation_songs TO service_role;
ALTER TABLE public.participation_songs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can attach song to own participation" ON public.participation_songs
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins manage songs" ON public.participation_songs
  FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE POLICY "Admins view songs" ON public.participation_songs
  FOR SELECT TO authenticated USING (has_role(auth.uid(),'admin'));

-- =========== Module 6: Archives ===========
CREATE TABLE public.archives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year text NOT NULL UNIQUE,
  archive_date timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  created_by_email text,
  remark text NOT NULL,
  summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  zip_path text,
  pdf_path text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.archives TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.archives TO authenticated;
GRANT ALL ON public.archives TO service_role;
ALTER TABLE public.archives ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view archives" ON public.archives FOR SELECT USING (true);
CREATE POLICY "Admins manage archives" ON public.archives
  FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

-- =========== Archive flags on existing tables ===========
ALTER TABLE public.households            ADD COLUMN IF NOT EXISTS is_archived boolean NOT NULL DEFAULT false, ADD COLUMN IF NOT EXISTS archived_year text;
ALTER TABLE public.household_members     ADD COLUMN IF NOT EXISTS is_archived boolean NOT NULL DEFAULT false, ADD COLUMN IF NOT EXISTS archived_year text;
ALTER TABLE public.donation_payments     ADD COLUMN IF NOT EXISTS is_archived boolean NOT NULL DEFAULT false, ADD COLUMN IF NOT EXISTS archived_year text;
ALTER TABLE public.programs              ADD COLUMN IF NOT EXISTS is_archived boolean NOT NULL DEFAULT false, ADD COLUMN IF NOT EXISTS archived_year text;
ALTER TABLE public.participants          ADD COLUMN IF NOT EXISTS is_archived boolean NOT NULL DEFAULT false, ADD COLUMN IF NOT EXISTS archived_year text;
ALTER TABLE public.prize_allocations     ADD COLUMN IF NOT EXISTS is_archived boolean NOT NULL DEFAULT false, ADD COLUMN IF NOT EXISTS archived_year text;
ALTER TABLE public.quiz_sessions         ADD COLUMN IF NOT EXISTS is_archived boolean NOT NULL DEFAULT false, ADD COLUMN IF NOT EXISTS archived_year text;
ALTER TABLE public.notices               ADD COLUMN IF NOT EXISTS is_archived boolean NOT NULL DEFAULT false, ADD COLUMN IF NOT EXISTS archived_year text;
ALTER TABLE public.competition_entries   ADD COLUMN IF NOT EXISTS is_archived boolean NOT NULL DEFAULT false, ADD COLUMN IF NOT EXISTS archived_year text;
ALTER TABLE public.account_expenses      ADD COLUMN IF NOT EXISTS is_archived boolean NOT NULL DEFAULT false, ADD COLUMN IF NOT EXISTS archived_year text;

-- =========== Read-only enforcement trigger ===========
CREATE OR REPLACE FUNCTION public.enforce_archive_readonly()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.is_archived = true THEN
      RAISE EXCEPTION 'Row is archived (read-only). Cannot delete.';
    END IF;
    RETURN OLD;
  END IF;
  IF TG_OP = 'UPDATE' THEN
    -- allow only flipping archive flags
    IF OLD.is_archived = true AND (NEW.is_archived = true) THEN
      RAISE EXCEPTION 'Row is archived (read-only). Cannot update.';
    END IF;
    RETURN NEW;
  END IF;
  RETURN NEW;
END $$;

DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY['households','household_members','donation_payments','programs','participants','prize_allocations','quiz_sessions','notices','competition_entries','account_expenses'])
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_archive_readonly ON public.%I', t);
    EXECUTE format('CREATE TRIGGER trg_archive_readonly BEFORE UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.enforce_archive_readonly()', t);
  END LOOP;
END $$;
