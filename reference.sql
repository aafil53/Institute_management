-- Template for any new table
CREATE POLICY "Admins can manage [table]"
  ON [table] FOR ALL
  USING (get_my_role() = 'admin')
  WITH CHECK (get_my_role() = 'admin');

CREATE POLICY "Teachers can manage their own [table]"
  ON [table] FOR ALL
  USING (get_my_role() = 'teacher')
  WITH CHECK (get_my_role() = 'teacher');

  //For every new feature you build, just use get_my_role() in your policies: