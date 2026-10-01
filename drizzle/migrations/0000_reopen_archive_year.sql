CREATE OR REPLACE FUNCTION public.reopen_archive_year(_year text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  t text;
  n int;
  result jsonb := '{}'::jsonb;
  actor_email text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  IF _year IS NULL OR length(trim(_year)) = 0 THEN
    RAISE EXCEPTION 'year required';
  END IF;
  FOR t IN SELECT unnest(ARRAY['households','household_members','donation_payments','programs','participants','prize_allocations','quiz_sessions','notices','competition_entries','account_expenses','ledger_expenses'])
  LOOP
    EXECUTE format('UPDATE public.%I SET is_archived = false, archived_year = NULL WHERE is_archived = true AND archived_year = $1', t) USING _year;
    GET DIAGNOSTICS n = ROW_COUNT;
    result := result || jsonb_build_object(t, n);
  END LOOP;
  SELECT email INTO actor_email FROM auth.users WHERE id = auth.uid();
  INSERT INTO public.admin_activity_logs (actor_user_id, actor_email, action, entity_type, entity_id, details)
  VALUES (auth.uid(), actor_email, 'reopen_archive_year', 'archives', _year, result);
  RETURN result;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.reopen_archive_year(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reopen_archive_year(text) TO authenticated;