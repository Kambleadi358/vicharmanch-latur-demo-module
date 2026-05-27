
CREATE TABLE public.annual_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  year TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  pdf_url TEXT,
  pdf_path TEXT,
  remark TEXT,
  total_jama NUMERIC NOT NULL DEFAULT 0,
  total_expense NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.annual_reports TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.annual_reports TO authenticated;
GRANT ALL ON public.annual_reports TO service_role;

ALTER TABLE public.annual_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view annual reports"
ON public.annual_reports FOR SELECT
USING (true);

CREATE POLICY "Admins manage annual reports"
ON public.annual_reports FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_annual_reports_updated_at
BEFORE UPDATE ON public.annual_reports
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO storage.buckets (id, name, public)
VALUES ('annual-reports', 'annual-reports', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public can read annual report pdfs"
ON storage.objects FOR SELECT
USING (bucket_id = 'annual-reports');

CREATE POLICY "Admins upload annual report pdfs"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'annual-reports' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update annual report pdfs"
ON storage.objects FOR UPDATE
USING (bucket_id = 'annual-reports' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete annual report pdfs"
ON storage.objects FOR DELETE
USING (bucket_id = 'annual-reports' AND has_role(auth.uid(), 'admin'::app_role));
