// Supabase Client and Helper Functions
import { createClient } from '@supabase/supabase-js'
import type {
  User,
  Class,
  Teacher,
  Student,
  TimetableEntry,
  AttendanceLog,
  AttendanceRecord,
} from '../types/supabase'

const SUPABASE_URL = (import.meta as any).env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = (import.meta as any).env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// ============================================================================
// Auth Functions
// ============================================================================

export async function signUp(email: string, password: string, userData: Partial<User>) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) throw error

    // Create user profile
    if (data.user) {
      const { error: profileError } = await supabase
        .from('users')
        .insert([
          {
            id: data.user.id,
            email,
            ...userData,
          },
        ])

      if (profileError) throw profileError
    }

    return data
  } catch (error) {
    console.error('Sign up error:', error)
    throw error
  }
}

export async function signIn(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error
    return data
  } catch (error) {
    console.error('Sign in error:', error)
    throw error
  }
}

export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  } catch (error) {
    console.error('Sign out error:', error)
    throw error
  }
}

export function onAuthStateChange(callback: (user: any) => void) {
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    callback(session?.user ?? null)
  })
  return data?.subscription
}

// ============================================================================
// Users Functions
// ============================================================================

export async function getCurrentUser() {
  try {
    const { data } = await supabase.auth.getUser()
    if (!data.user) return null

    const { data: userData, error } = await supabase
      .from('users')
      .select('id, name, email, role, department')
      .eq('id', data.user.id)
      .maybeSingle()

    if (error) {
      console.error('Get current user database error:', error)
      return null
    }

    if (!userData) {
      console.warn('Profile not found in users table for auth ID:', data.user.id)
      return null
    }

    return userData as User
  } catch (error) {
    console.error('Get current user exception:', error)
    return null
  }
}

export async function adminCreateUser(
  email: string,
  password: string,
  userData: Omit<User, 'id' | 'email' | 'created_at' | 'updated_at'>,
  contact?: string
) {
  // Create a separate temporary client instance to prevent changing the current session
  const tempSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storage: {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
      }
    }
  })

  // Sign up the new user
  const { data, error } = await tempSupabase.auth.signUp({
    email,
    password,
  })

  console.log("Signup response:", data);
  console.log("Signup error:", error);

  if (error) {
    console.error("Create user failed:", error.message, error.status, error);
    throw error;
  }

  if (!data.user) {
    throw new Error('User creation failed: No user returned')
  }

  const newUserId = data.user.id

  // Create public user profile using the standard client (which is authenticated as admin)
  const { error: profileError } = await supabase
    .from('users')
    .insert([
      {
        id: newUserId,
        email,
        name: userData.name,
        role: userData.role,
        department: userData.department,
      },
    ])

  if (profileError) throw profileError

  // Create teacher profile if specified
  if (userData.role === 'teacher') {
    const { error: teacherError } = await supabase
      .from('teachers')
      .insert([
        {
          user_id: newUserId,
          name: userData.name,
          employee_id: `T-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
          email,
          department: userData.department || 'General',
          contact: contact || null,
        },
      ])

    if (teacherError) throw teacherError
  }

  return data.user
}

export async function updateUserProfile(userId: string, updates: Partial<User>) {
  try {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error
    return data as User
  } catch (error) {
    console.error('Update user profile error:', error)
    throw error
  }
}

// ============================================================================
// Teachers Functions
// ============================================================================

export async function getTeachers() {
  try {
    const { data, error } = await supabase.from('teachers').select('*')

    if (error) throw error
    return data as Teacher[]
  } catch (error) {
    console.error('Get teachers error:', error)
    throw error
  }
}

export async function getTeacherById(id: string) {
  try {
    const { data, error } = await supabase
      .from('teachers')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data as Teacher
  } catch (error) {
    console.error('Get teacher error:', error)
    throw error
  }
}

export async function getTeacherByUserId(userId: string) {
  try {
    const { data, error } = await supabase
      .from('teachers')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) throw error
    return data as Teacher
  } catch (error) {
    console.error('Get teacher by user error:', error)
    throw error
  }
}

// ============================================================================
// Students Functions
// ============================================================================

export async function getStudents() {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('*, classes(*)')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  } catch (error) {
    console.error('Get students error:', error)
    throw error
  }
}

export async function getStudentsByClass(classId: string) {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('class_id', classId)
      .eq('is_active', true)
      .order('roll_no', { ascending: true })

    if (error) throw error
    return data as Student[]
  } catch (error) {
    console.error('Get students by class error:', error)
    throw error
  }
}

// ============================================================================
// Classes Functions
// ============================================================================

export async function getClasses() {
  try {
    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .order('name', { ascending: true })

    if (error) throw error
    return data as Class[]
  } catch (error) {
    console.error('Get classes error:', error)
    throw error
  }
}

export async function getClassById(id: string) {
  try {
    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data as Class
  } catch (error) {
    console.error('Get class error:', error)
    throw error
  }
}

// ============================================================================
// Timetable Functions
// ============================================================================

export async function getTimetable() {
  try {
    const { data, error } = await supabase
      .from('timetable_entries')
      .select('*, classes(*), teachers(*)')
      .eq('status', 'active')
      .order('day_of_week', { ascending: true })
      .order('start_time', { ascending: true })

    if (error) throw error
    return data
  } catch (error) {
    console.error('Get timetable error:', error)
    throw error
  }
}

export async function getTimetableForClass(classId: string) {
  try {
    const { data, error } = await supabase
      .from('timetable_entries')
      .select('*, teachers(*)')
      .eq('class_id', classId)
      .eq('status', 'active')
      .order('day_of_week', { ascending: true })
      .order('start_time', { ascending: true })

    if (error) throw error
    return data
  } catch (error) {
    console.error('Get class timetable error:', error)
    throw error
  }
}

export async function getTimetableForTeacher(teacherId: string) {
  try {
    const { data, error } = await supabase
      .from('timetable_entries')
      .select('*, classes(*)')
      .eq('teacher_id', teacherId)
      .eq('status', 'active')
      .order('day_of_week', { ascending: true })
      .order('start_time', { ascending: true })

    if (error) throw error
    return data
  } catch (error) {
    console.error('Get teacher timetable error:', error)
    throw error
  }
}

// ============================================================================
// Attendance Functions
// ============================================================================

export async function createAttendanceLog(logData: Omit<AttendanceLog, 'id' | 'created_at' | 'updated_at'>) {
  try {
    const { data, error } = await supabase
      .from('attendance_logs')
      .insert([logData])
      .select()
      .single()

    if (error) throw error
    return data as AttendanceLog
  } catch (error) {
    console.error('Create attendance log error:', error)
    throw error
  }
}

export async function addAttendanceRecords(records: Omit<AttendanceRecord, 'id' | 'created_at' | 'updated_at'>[]) {
  try {
    const { data, error } = await supabase
      .from('attendance_records')
      .insert(records)
      .select()

    if (error) throw error
    return data as AttendanceRecord[]
  } catch (error) {
    console.error('Add attendance records error:', error)
    throw error
  }
}

export async function updateAttendanceRecord(
  recordId: string,
  updates: Partial<AttendanceRecord>,
) {
  try {
    const { data, error } = await supabase
      .from('attendance_records')
      .update(updates)
      .eq('id', recordId)
      .select()
      .single()

    if (error) throw error
    return data as AttendanceRecord
  } catch (error) {
    console.error('Update attendance record error:', error)
    throw error
  }
}

export async function getAttendanceForStudent(studentId: string) {
  try {
    const { data, error } = await supabase
      .from('attendance_records')
      .select('*, attendance_logs(*)')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  } catch (error) {
    console.error('Get student attendance error:', error)
    throw error
  }
}

export async function getAttendanceLogsForTeacher(teacherId: string, date?: string) {
  try {
    let query = supabase
      .from('attendance_logs')
      .select('*, attendance_records(*)')
      .eq('teacher_id', teacherId)

    if (date) {
      query = query.eq('date', date)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw error
    return data
  } catch (error) {
    console.error('Get teacher attendance logs error:', error)
    throw error
  }
}

export async function getAttendanceSummary(classId: string, startDate: string, endDate: string) {
  try {
    const { data, error } = await supabase
      .from('attendance_logs')
      .select('*, attendance_records(*)')
      .eq('class_id', classId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false })

    if (error) throw error
    return data
  } catch (error) {
    console.error('Get attendance summary error:', error)
    throw error
  }
}

// ============================================================================
// Realtime Subscriptions
// ============================================================================

export function subscribeToAttendanceLogs(classId: string, callback: (data: any) => void) {
  const subscription = supabase
    .channel(`attendance_logs:class_id=eq.${classId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'attendance_logs',
        filter: `class_id=eq.${classId}`,
      },
      (payload) => {
        callback(payload)
      },
    )
    .subscribe()

  return subscription
}

export function subscribeToAttendanceRecords(logId: string, callback: (data: any) => void) {
  const subscription = supabase
    .channel(`attendance_records:log_id=eq.${logId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'attendance_records',
        filter: `log_id=eq.${logId}`,
      },
      (payload) => {
        callback(payload)
      },
    )
    .subscribe()

  return subscription
}
