REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.promote_education_levels() TO authenticated;
GRANT EXECUTE ON FUNCTION public.recalculate_quiz_scores() TO authenticated;
GRANT EXECUTE ON FUNCTION public.next_entry_code(uuid, text) TO authenticated;