-- Row Level Security (RLS) Policies for Hudur Attendance System
-- These policies secure data access based on user roles

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetable_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

-- Users Table Policies
CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  USING (auth.uid()::text = id::text);

CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid()::uuid AND u.role = 'admin'
    )
  );

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  USING (auth.uid()::text = id::text);

-- Classes Table Policies
CREATE POLICY "Everyone can view classes"
  ON classes FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage classes"
  ON classes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid()::uuid AND u.role = 'admin'
    )
  );

-- Teachers Table Policies
CREATE POLICY "Everyone can view teachers"
  ON teachers FOR SELECT
  USING (true);

CREATE POLICY "Teachers can view their own record"
  ON teachers FOR SELECT
  USING (user_id = auth.uid()::uuid);

CREATE POLICY "Admins can manage teachers"
  ON teachers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid()::uuid AND u.role = 'admin'
    )
  );

-- Students Table Policies
CREATE POLICY "Everyone can view students"
  ON students FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage students"
  ON students FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid()::uuid AND u.role = 'admin'
    )
  );

-- Timetable Entries Policies
CREATE POLICY "Everyone can view timetable"
  ON timetable_entries FOR SELECT
  USING (true);

CREATE POLICY "Teachers can manage their timetable"
  ON timetable_entries FOR ALL
  USING (
    teacher_id IN (
      SELECT id FROM teachers 
      WHERE user_id = auth.uid()::uuid
    )
  );

CREATE POLICY "Admins can manage timetable"
  ON timetable_entries FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid()::uuid AND u.role = 'admin'
    )
  );

-- Attendance Logs Policies
CREATE POLICY "Teachers can create attendance logs"
  ON attendance_logs FOR INSERT
  WITH CHECK (
    teacher_id IN (
      SELECT id FROM teachers 
      WHERE user_id = auth.uid()::uuid
    )
  );

CREATE POLICY "Teachers can view their attendance logs"
  ON attendance_logs FOR SELECT
  USING (
    teacher_id IN (
      SELECT id FROM teachers 
      WHERE user_id = auth.uid()::uuid
    )
  );

CREATE POLICY "Admins can view all attendance logs"
  ON attendance_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid()::uuid AND u.role = 'admin'
    )
  );

CREATE POLICY "Teachers can update their attendance logs"
  ON attendance_logs FOR UPDATE
  USING (
    teacher_id IN (
      SELECT id FROM teachers 
      WHERE user_id = auth.uid()::uuid
    )
  );

CREATE POLICY "Admins can manage attendance logs"
  ON attendance_logs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid()::uuid AND u.role = 'admin'
    )
  );

-- Attendance Records Policies
CREATE POLICY "Teachers can create attendance records"
  ON attendance_records FOR INSERT
  WITH CHECK (
    log_id IN (
      SELECT id FROM attendance_logs 
      WHERE teacher_id IN (
        SELECT id FROM teachers 
        WHERE user_id = auth.uid()::uuid
      )
    )
  );

CREATE POLICY "Teachers can view attendance records for their classes"
  ON attendance_records FOR SELECT
  USING (
    log_id IN (
      SELECT id FROM attendance_logs 
      WHERE teacher_id IN (
        SELECT id FROM teachers 
        WHERE user_id = auth.uid()::uuid
      )
    )
  );

CREATE POLICY "Admins can view all attendance records"
  ON attendance_records FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid()::uuid AND u.role = 'admin'
    )
  );

CREATE POLICY "Teachers can update attendance records"
  ON attendance_records FOR UPDATE
  USING (
    log_id IN (
      SELECT id FROM attendance_logs 
      WHERE teacher_id IN (
        SELECT id FROM teachers 
        WHERE user_id = auth.uid()::uuid
      )
    )
  );

CREATE POLICY "Admins can manage attendance records"
  ON attendance_records FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid()::uuid AND u.role = 'admin'
    )
  );
