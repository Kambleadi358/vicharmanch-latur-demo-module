DROP VIEW IF EXISTS public.public_vote_choices;
DROP VIEW IF EXISTS public.archives_public;

-- public_votes: column-limited public read
REVOKE SELECT ON public.public_votes FROM anon, authenticated;
GRANT SELECT (id, competition_id, category, first_entry_id, second_entry_id, third_entry_id, created_at)
  ON public.public_votes TO anon, authenticated;
CREATE POLICY "Public read vote choices" ON public.public_votes
  FOR SELECT TO anon, authenticated USING (true);

-- archives: column-limited public read
REVOKE SELECT ON public.archives FROM anon, authenticated;
GRANT SELECT (id, year, archive_date, remark, summary, zip_path, pdf_path, created_at)
  ON public.archives TO anon, authenticated;
CREATE POLICY "Public read archive summary" ON public.archives
  FOR SELECT TO anon, authenticated USING (true);