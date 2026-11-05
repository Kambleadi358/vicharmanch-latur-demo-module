CREATE OR REPLACE FUNCTION public.admin_delete_active_household(_household_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_archived boolean;
  v_archived_members integer;
  v_archived_payments integer;
  v_archived_participants integer;
  v_member_ids uuid[];
  v_member_count integer;
  v_participant_count integer;
  v_payment_count integer;
  v_assignment_count integer;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RETURN jsonb_build_object('status', 'blocked', 'reason', 'या कृतीसाठी व्यवस्थापकाची परवानगी आवश्यक आहे.');
  END IF;

  SELECT h.is_archived
    INTO v_archived
    FROM public.households AS h
   WHERE h.id = _household_id
   FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'not_found', 'reason', 'हे घर उपलब्ध नाही.');
  END IF;
  IF v_archived THEN
    RETURN jsonb_build_object('status', 'blocked', 'reason', 'हे घर वार्षिक अभिलेखागारात संग्रहित आहे — फक्त वाचनासाठी.');
  END IF;

  SELECT COALESCE(array_agg(m.id), ARRAY[]::uuid[]), count(*)::integer
    INTO v_member_ids, v_member_count
    FROM public.household_members AS m
   WHERE m.household_id = _household_id;

  SELECT count(*)::integer
    INTO v_archived_members
    FROM public.household_members AS m
   WHERE m.household_id = _household_id AND m.is_archived;
  SELECT count(*)::integer
    INTO v_archived_payments
    FROM public.donation_payments AS d
   WHERE d.household_id = _household_id AND d.is_archived;
  SELECT count(*)::integer
    INTO v_archived_participants
    FROM public.participants AS p
   WHERE p.household_member_id = ANY(v_member_ids) AND p.is_archived;

  IF v_archived_members > 0 OR v_archived_payments > 0 OR v_archived_participants > 0 THEN
    RETURN jsonb_build_object(
      'status', 'blocked',
      'reason', concat_ws(' ',
        CASE WHEN v_archived_members > 0 THEN format('या घराचे %s सदस्य संग्रहित आहेत.', v_archived_members) END,
        CASE WHEN v_archived_payments > 0 THEN format('या घराच्या %s देणगी नोंदी संग्रहित आहेत.', v_archived_payments) END,
        CASE WHEN v_archived_participants > 0 THEN format('या घराशी जोडलेल्या %s सहभागी नोंदी संग्रहित आहेत.', v_archived_participants) END,
        'संग्रहित नोंदी सुरक्षित ठेवण्यासाठी हे घर हटवता येणार नाही.'
      ),
      'archived_members', v_archived_members,
      'archived_payments', v_archived_payments,
      'archived_participants', v_archived_participants
    );
  END IF;

  SELECT count(*)::integer
    INTO v_payment_count
    FROM public.donation_payments AS d
   WHERE d.household_id = _household_id;
  SELECT count(*)::integer
    INTO v_assignment_count
    FROM public.household_year_assignments AS a
   WHERE a.household_id = _household_id;
  SELECT count(*)::integer
    INTO v_participant_count
    FROM public.participants AS p
   WHERE p.household_member_id = ANY(v_member_ids);

  -- Keep competition participation history while removing the household/member link.
  UPDATE public.participants
     SET household_member_id = NULL
   WHERE household_member_id = ANY(v_member_ids) AND NOT is_archived;

  DELETE FROM public.households WHERE id = _household_id;

  RETURN jsonb_build_object(
    'status', 'deleted',
    'members_deleted', v_member_count,
    'payments_deleted', v_payment_count,
    'assignments_deleted', v_assignment_count,
    'participant_links_cleared', v_participant_count
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('status', 'error', 'reason', SQLERRM);
END;
$function$;

REVOKE ALL ON FUNCTION public.admin_delete_active_household(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_delete_active_household(uuid) TO authenticated;