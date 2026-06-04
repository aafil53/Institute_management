// Supabase Database Types
// Auto-generated type definitions matching the database schema

export interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'teacher' | 'student'
  department?: string
  created_at: string
  updated_at: string
}

export interface Class {
  id: string
  name: string
  department: string
  created_at: string
  updated_at: string
}

export interface Teacher {
  id: string
  user_id: string
  name: string
  employee_id: string
  email: string
  department: string
  contact?: string
  created_at: string
  updated_at: string
}

export interface Student {
  id: string
  name: string
  roll_no: string
  class_id: string
  email?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface TimetableEntry {
  id: string
  class_id: string
  course_name: string
  teacher_id: string
  day_of_week: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday'
  start_time: string // Format: HH:MM:SS
  end_time: string // Format: HH:MM:SS
  room?: string
  status: 'active' | 'inactive' | 'cancelled'
  created_at: string
  updated_at: string
}

export interface AttendanceLog {
  id: string
  date: string // Format: YYYY-MM-DD
  class_id: string
  timetable_id: string
  course_name: string
  teacher_id: string
  marked_at: string
  created_at: string
  updated_at: string
}

export interface AttendanceRecord {
  id: string
  log_id: string
  student_id: string
  student_name: string
  status: 'present' | 'absent' | 'late' | 'excused'
  note?: string
  created_at: string
  updated_at: string
}

// Join types for queries with relations
export interface TimetableWithDetails extends TimetableEntry {
  classes?: Class
  teachers?: Teacher
}

export interface AttendanceLogWithRecords extends AttendanceLog {
  attendance_records?: AttendanceRecord[]
  teachers?: Teacher
  classes?: Class
}

export interface StudentWithClass extends Student {
  classes?: Class
}

export interface TeacherWithUser extends Teacher {
  users?: User
}

// Request/Response types
export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  user: User
  token: string
}

export interface CreateAttendanceRequest {
  date: string
  class_id: string
  timetable_id: string
  course_name: string
  teacher_id: string
  records: Array<{
    student_id: string
    student_name: string
    status: 'present' | 'absent' | 'late' | 'excused'
    note?: string
  }>
}

export interface AttendanceStats {
  total_classes: number
  attended: number
  absent: number
  late: number
  excused: number
  percentage: number
}
