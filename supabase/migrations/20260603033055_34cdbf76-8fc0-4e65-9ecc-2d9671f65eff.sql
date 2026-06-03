
-- participation-songs: public insert, admin read/manage
CREATE POLICY "Anyone can upload songs" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'participation-songs');
CREATE POLICY "Admins read songs" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'participation-songs' AND has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage songs storage" ON storage.objects
  FOR ALL TO authenticated USING (bucket_id = 'participation-songs' AND has_role(auth.uid(),'admin'))
  WITH CHECK (bucket_id = 'participation-songs' AND has_role(auth.uid(),'admin'));

-- archives: admin-only
CREATE POLICY "Admins read archives" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'archives' AND has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage archives storage" ON storage.objects
  FOR ALL TO authenticated USING (bucket_id = 'archives' AND has_role(auth.uid(),'admin'))
  WITH CHECK (bucket_id = 'archives' AND has_role(auth.uid(),'admin'));
