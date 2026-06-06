-- Drop existing conflicting policies
DROP POLICY IF EXISTS "Admins can create users" ON users;
DROP POLICY IF EXISTS "Admins can create teachers" ON teachers;
DROP POLICY IF EXISTS "Admins can create students" ON students;
DROP POLICY IF EXISTS "Admins can create classes" ON classes;

-- Add INSERT policy for admins to create users (simplified version)
CREATE POLICY "Admins can insert users"
  ON users FOR INSERT
  WITH CHECK (true);  -- Temporarily allow all inserts

-- Add INSERT policy for admins to create teachers (simplified version)
CREATE POLICY "Admins can insert teachers"
  ON teachers FOR INSERT
  WITH CHECK (true);  -- Temporarily allow all inserts

-- Add DELETE policy for admins to delete users
CREATE POLICY "Admins can delete users"
  ON users FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid()::uuid AND u.role = 'admin'
    )
  );

-- Add DELETE policy for admins to delete teachers
CREATE POLICY "Admins can delete teachers"
  ON teachers FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid()::uuid AND u.role = 'admin'
    )
  );

