
CREATE TABLE public.ledger_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year text NOT NULL,
  title text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  is_archived boolean NOT NULL DEFAULT false,
  archived_year text
);

GRANT SELECT ON public.ledger_expenses TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ledger_expenses TO authenticated;
GRANT ALL ON public.ledger_expenses TO service_role;

ALTER TABLE public.ledger_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view ledger expenses"
  ON public.ledger_expenses FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins manage ledger expenses"
  ON public.ledger_expenses FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER set_ledger_expenses_updated_at
  BEFORE UPDATE ON public.ledger_expenses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER ledger_expenses_archive_readonly
  BEFORE UPDATE OR DELETE ON public.ledger_expenses
  FOR EACH ROW EXECUTE FUNCTION public.enforce_archive_readonly();

CREATE INDEX idx_ledger_expenses_year ON public.ledger_expenses(year);
