DROP POLICY IF EXISTS "Participants upload songs into valid path" ON storage.objects;
CREATE POLICY "Participants upload songs into valid path" ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    bucket_id = 'participation-songs'
    AND length(name) BETWEEN 5 AND 400
    AND name !~ '/'
    AND lower(name) ~ '\.(mp3|wav|m4a|aac|ogg|mpeg|mp4)$'
    AND EXISTS (
      SELECT 1 FROM public.participants p
      WHERE p.id::text = split_part(name, '.', 1)
        AND p.is_archived = false
    )
  );

GRANT SELECT ON public.archives TO authenticated;