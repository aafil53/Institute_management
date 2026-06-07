import React, { useState, useEffect, useCallback } from 'react';

// Context & Auth
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Supabase helpers
import {
  supabase,
  getClasses,
  getTeachers,
  getStudents,
  getTimetable,
  getTeacherByUserId,
  createAttendanceLog,
  addAttendanceRecords,
  getAttendanceSummary,
  getAttendanceLogsForTeacher,
} from './lib/supabase';

// Supabase DB types
import type {
  Class,
  Teacher,
  Student,
  TimetableEntry,
  AttendanceLog,
  AttendanceRecord,
} from './types/supabase';

// App-local attendance shape (matches AttendanceMarker / Reports contracts)
import type { AttendanceLog as AppAttendanceLog } from './types';

// Component imports
import DashboardTeacher from './components/DashboardTeacher';
import AttendanceMarker from './components/AttendanceMarker';
import DashboardAdmin from './components/DashboardAdmin';
import StudentDirectory from './components/StudentDirectory';
import TeacherDirectory from './components/TeacherDirectory';
import ClassTimetableSetup from './components/ClassTimetableSetup';
import Reports from './components/Reports';
import Navigation from './components/Navigation';
import UserManagement from './components/UserManagement';
import TimetableManager from './components/TimetableManager';

// Lucide icons
import {
  Users,
  Calendar,
  FileText,
  TrendingUp,
  Layers,
  GraduationCap,
  UserCheck,
  CheckSquare,
  Menu,
  X,
  TableProperties,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Helpers — map Supabase snake_case shapes → legacy camelCase shapes
// that the existing child components still expect.
// ---------------------------------------------------------------------------

function mapClass(c: Class) {
  return { id: c.id, name: c.name, department: c.department };
}

function mapTeacher(t: Teacher) {
  return {
    id: t.id,
    name: t.name,
    employeeId: t.employee_id,
    email: t.email,
    department: t.department,
    contact: t.contact,
  };
}

function mapStudent(s: Student) {
  return {
    id: s.id,
    name: s.name,
    rollNo: s.roll_no,
    classId: s.class_id,
    email: s.email ?? '',
    isActive: s.is_active,
  };
}

function mapTimetableEntry(e: TimetableEntry) {
  return {
    id: e.id,
    classId: e.class_id,
    courseName: e.course_name,
    teacherId: e.teacher_id,
    dayOfWeek: e.day_of_week as any,
    startTime: e.start_time.substring(0, 5), // 'HH:MM:SS' → 'HH:MM'
    endTime: e.end_time.substring(0, 5),
    room: e.room ?? '',
    status: (e.status === 'active' ? 'Active' : e.status === 'cancelled' ? 'Cancelled' : 'Active') as any,
  };
}

function mapAttendanceLog(
  log: AttendanceLog,
  records: AttendanceRecord[]
): AppAttendanceLog {
  return {
    id: log.id,
    date: log.date,
    classId: log.class_id,
    timetableId: log.timetable_id,
    courseName: log.course_name,
    teacherId: log.teacher_id,
    markedAt: log.marked_at,
    records: records.map(r => ({
      studentId: r.student_id,
      studentName: r.student_name,
      status: (r.status.charAt(0).toUpperCase() + r.status.slice(1)) as any,
      note: r.note,
    })),
  };
}

// ---------------------------------------------------------------------------
// Main App component
// ---------------------------------------------------------------------------

export default function App() {
  const { user } = useAuth();

  // UI state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeScreen, setActiveScreen] = useState<string>('teacher_dash');
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  const [simulatedDay, setSimulatedDay] = useState<string>(() => {
    const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDay = weekDays[new Date().getDay()];
    return currentDay === 'Sunday' || currentDay === 'Saturday' ? 'Monday' : currentDay;
  });

  // Data state (mapped to legacy camelCase for child components)
  const [classes, setClasses] = useState<ReturnType<typeof mapClass>[]>([]);
  const [teachers, setTeachers] = useState<ReturnType<typeof mapTeacher>[]>([]);
  const [students, setStudents] = useState<ReturnType<typeof mapStudent>[]>([]);
  const [timetable, setTimetable] = useState<ReturnType<typeof mapTimetableEntry>[]>([]);
  const [attendanceLogs, setAttendanceLogs] = useState<AppAttendanceLog[]>([]);

  // The Teacher record belonging to the currently logged-in teacher user
  const [currentTeacher, setCurrentTeacher] = useState<ReturnType<typeof mapTeacher> | null>(null);

  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Data loading
  // ---------------------------------------------------------------------------

  const loadAllData = useCallback(async () => {
    if (!user) return;
    setDataLoading(true);
    setDataError(null);
    try {
      const [rawClasses, rawTeachers, rawStudents, rawTimetable] = await Promise.all([
        getClasses(),
        getTeachers(),
        getStudents(),
        getTimetable(),
      ]);

      const mappedClasses = rawClasses.map(mapClass);
      const mappedTeachers = rawTeachers.map(mapTeacher);
      const mappedStudents = rawStudents.map(mapStudent);
      const mappedTimetable = (rawTimetable as TimetableEntry[]).map(mapTimetableEntry);

      setClasses(mappedClasses);
      setTeachers(mappedTeachers);
      setStudents(mappedStudents);
      setTimetable(mappedTimetable);

      // Resolve current teacher record if the user is a teacher
      if (user.role === 'teacher') {
        try {
          const teacherRecord = await getTeacherByUserId(user.id);
          setCurrentTeacher(mapTeacher(teacherRecord));
        } catch {
          // Teacher profile might not exist yet; fall back to first teacher
          setCurrentTeacher(mappedTeachers[0] ?? null);
        }
      }

      // Load attendance logs scoped to role
      await loadAttendanceLogs(user, rawTeachers);
    } catch (err: any) {
      console.error('Data load error:', err);
      setDataError(err?.message ?? 'Failed to load data from Supabase.');
    } finally {
      setDataLoading(false);
    }
  }, [user]);

  const loadAttendanceLogs = async (currentUser: typeof user, rawTeachers: Teacher[]) => {
    if (!currentUser) return;
    try {
      let rawLogs: any[];
      if (currentUser.role === 'teacher') {
        // Find teacher id from user id
        const myTeacher = rawTeachers.find((t) => t.user_id === currentUser.id);
        if (!myTeacher) { setAttendanceLogs([]); return; }
        rawLogs = await getAttendanceLogsForTeacher(myTeacher.id) ?? [];
      } else {
        // Admin: load all logs (last 90 days across all classes)
        const today = new Date().toISOString().split('T')[0];
        const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const allClasses = await getClasses();
        const logsArrays = await Promise.all(
          allClasses.map(cls => getAttendanceSummary(cls.id, ninetyDaysAgo, today).catch(() => []))
        );
        rawLogs = logsArrays.flat();
      }

      const mapped: AppAttendanceLog[] = rawLogs.map((log: any) => {
        const records: AttendanceRecord[] = log.attendance_records ?? [];
        return mapAttendanceLog(log as AttendanceLog, records);
      });
      setAttendanceLogs(mapped);
    } catch (err) {
      console.error('Attendance load error:', err);
      setAttendanceLogs([]);
    }
  };

  // Load data once on mount and whenever user changes
  useEffect(() => {
    if (user) {
      loadAllData();
      // Set initial screen based on role
      setActiveScreen(user.role === 'admin' ? 'admin_dash' : 'teacher_dash');
    }
  }, [user?.id, user?.role]);

  // ---------------------------------------------------------------------------
  // Mutation handlers — write to Supabase, then refresh relevant state
  // ---------------------------------------------------------------------------

  // --- Students ---
  const handleAddStudent = async (newStud: Omit<ReturnType<typeof mapStudent>, 'id'>) => {
    const { error } = await supabase.from('students').insert([{
      name: newStud.name,
      roll_no: newStud.rollNo,
      class_id: newStud.classId,
      email: newStud.email || null,
      is_active: newStud.isActive,
    }]);
    if (error) { console.error('Add student error:', error); return; }
    const raw = await getStudents();
    setStudents(raw.map(mapStudent));
  };

  const handleEditStudent = async (updatedStud: ReturnType<typeof mapStudent>) => {
    const { error } = await supabase.from('students').update({
      name: updatedStud.name,
      roll_no: updatedStud.rollNo,
      class_id: updatedStud.classId,
      email: updatedStud.email || null,
      is_active: updatedStud.isActive,
    }).eq('id', updatedStud.id);
    if (error) { console.error('Edit student error:', error); return; }
    const raw = await getStudents();
    setStudents(raw.map(mapStudent));
  };

  const handleDeleteStudent = async (studentId: string) => {
    const { error } = await supabase.from('students').delete().eq('id', studentId);
    if (error) { console.error('Delete student error:', error); return; }
    setStudents(prev => prev.filter(s => s.id !== studentId));
  };

  // --- Teachers ---
  const handleAddTeacher = async (newTeach: Omit<ReturnType<typeof mapTeacher>, 'id'>) => {
    const { error } = await supabase.from('teachers').insert([{
      name: newTeach.name,
      employee_id: newTeach.employeeId || `T-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      email: newTeach.email,
      department: newTeach.department,
      contact: newTeach.contact || null,
    }]);
    if (error) { console.error('Add teacher error:', error); return; }
    const raw = await getTeachers();
    setTeachers(raw.map(mapTeacher));
  };

  const handleEditTeacher = async (updatedTeach: ReturnType<typeof mapTeacher>) => {
    const { error } = await supabase.from('teachers').update({
      name: updatedTeach.name,
      employee_id: updatedTeach.employeeId,
      email: updatedTeach.email,
      department: updatedTeach.department,
      contact: updatedTeach.contact || null,
    }).eq('id', updatedTeach.id);
    if (error) { console.error('Edit teacher error:', error); return; }
    const raw = await getTeachers();
    setTeachers(raw.map(mapTeacher));
  };

  const handleDeleteTeacher = async (teacherId: string) => {
    const { error } = await supabase.from('teachers').delete().eq('id', teacherId);
    if (error) { console.error('Delete teacher error:', error); return; }
    setTeachers(prev => prev.filter(t => t.id !== teacherId));
    setTimetable(prev => prev.filter(e => e.teacherId !== teacherId));
  };

  // --- Classes ---
  const handleAddClass = async (newCls: Omit<ReturnType<typeof mapClass>, 'id'>) => {
    const { error } = await supabase.from('classes').insert([{
      name: newCls.name,
      department: newCls.department,
    }]);
    if (error) { console.error('Add class error:', error); return; }
    const raw = await getClasses();
    setClasses(raw.map(mapClass));
  };

  const handleDeleteClass = async (classId: string) => {
    const { error } = await supabase.from('classes').delete().eq('id', classId);
    if (error) { console.error('Delete class error:', error); return; }
    setClasses(prev => prev.filter(c => c.id !== classId));
    setTimetable(prev => prev.filter(e => e.classId !== classId));
    setStudents(prev => prev.filter(s => s.classId !== classId));
  };

  // --- Timetable ---
  const handleAddTimetableEntry = async (newEntry: Omit<ReturnType<typeof mapTimetableEntry>, 'id'>) => {
    const { error } = await supabase.from('timetable_entries').insert([{
      class_id: newEntry.classId,
      course_name: newEntry.courseName,
      teacher_id: newEntry.teacherId,
      day_of_week: newEntry.dayOfWeek,
      start_time: newEntry.startTime,
      end_time: newEntry.endTime,
      room: newEntry.room || null,
      status: 'active',
    }]);
    if (error) { console.error('Add timetable entry error:', error); return; }
    const raw = await getTimetable();
    setTimetable((raw as TimetableEntry[]).map(mapTimetableEntry));
  };

  const handleDeleteTimetableEntry = async (entryId: string) => {
    const { error } = await supabase.from('timetable_entries').delete().eq('id', entryId);
    if (error) { console.error('Delete timetable entry error:', error); return; }
    setTimetable(prev => prev.filter(e => e.id !== entryId));
  };

  const handleUpdateTimetableEntry = async (updatedEntry: ReturnType<typeof mapTimetableEntry>) => {
    const { error } = await supabase.from('timetable_entries').update({
      class_id: updatedEntry.classId,
      course_name: updatedEntry.courseName,
      teacher_id: updatedEntry.teacherId,
      day_of_week: updatedEntry.dayOfWeek,
      start_time: updatedEntry.startTime,
      end_time: updatedEntry.endTime,
      room: updatedEntry.room || null,
      status: updatedEntry.status?.toLowerCase() ?? 'active',
    }).eq('id', updatedEntry.id);
    if (error) { console.error('Update timetable entry error:', error); return; }
    const raw = await getTimetable();
    setTimetable((raw as TimetableEntry[]).map(mapTimetableEntry));
  };

  // --- Attendance ---
  const handleSaveAttendance = async (newLog: AppAttendanceLog) => {
    try {
      const { data: logRow, error: logError } = await supabase
        .from('attendance_logs')
        .upsert({
          date: newLog.date,
          class_id: newLog.classId,
          timetable_id: newLog.timetableId,
          course_name: newLog.courseName,
          teacher_id: newLog.teacherId,
          marked_at: newLog.markedAt,
        }, { onConflict: 'date,class_id,timetable_id' })
        .select()
        .single();

      if (logError) throw logError;

      const { error: recError } = await supabase
        .from('attendance_records')
        .upsert(
          newLog.records.map(r => ({
            log_id: logRow.id,
            student_id: r.studentId,
            student_name: r.studentName,
            status: r.status.toLowerCase(),
            note: r.note ?? null,
          })),
          { onConflict: 'log_id,student_id' }
        );

      if (recError) throw recError;

      await loadAttendanceLogs(user, await getTeachers());
    } catch (err) {
      console.error('Save attendance error:', err);
    } finally {
      setActiveScreen('teacher_dash');
      setActiveSessionId(null);
    }
  };

  // ---------------------------------------------------------------------------
  // Derived values
  // ---------------------------------------------------------------------------

  const activeTeacher = user?.role === 'teacher'
    ? currentTeacher ?? teachers[0]
    : teachers[0];

  const activeSessionEntry = timetable.find(e => e.id === activeSessionId);

  const handleStartAttendanceLauncher = (timetableId: string) => {
    setActiveSessionId(timetableId);
    setActiveScreen('attendance_marker');
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (dataLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-slate-500 text-sm font-medium">Loading data…</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (dataError) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-6">
          <div className="max-w-md text-center space-y-4">
            <p className="text-red-600 font-semibold">Failed to load data</p>
            <p className="text-slate-500 text-sm">{dataError}</p>
            <button
              onClick={loadAllData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition"
            >
              Retry
            </button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div id="application-layout" className="min-h-screen flex flex-col bg-[#fafafa]">

        {/* Top Navigation Bar */}
        <Navigation
          activeScreen={activeScreen}
          onNavigate={setActiveScreen}
          mobileMenuOpen={mobileMenuOpen}
          onToggleMobileMenu={setMobileMenuOpen}
        />

        <div className="flex-1 flex overflow-hidden relative">

          {/* SIDEBAR NAVIGATION (Desktop) */}
          <aside id="desktop-sidebar" className="hidden lg:flex w-60 bg-white border-r border-slate-200 flex-col shrink-0">
            <div className="p-6 flex items-center gap-3 border-b border-slate-200">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-extrabold text-sm shadow-sm select-none">
                A
              </div>
              <div>
                <h1 className="font-bold text-slate-900 text-base tracking-tight font-sans">Attendly</h1>
                <p className="text-[10px] text-slate-400 font-mono uppercase tracking-widest leading-none mt-0.5">Hudur Institute</p>
              </div>
            </div>

            <nav className="flex-1 px-4 py-5 space-y-1 overflow-y-auto">
              {/* Dashboard */}
              <button
                id="nav-link-dashboard"
                onClick={() => setActiveScreen(user?.role === 'teacher' ? 'teacher_dash' : 'admin_dash')}
                className={`w-full text-left flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-all cursor-pointer ${activeScreen === 'teacher_dash' || activeScreen === 'admin_dash'
                    ? 'bg-blue-600 text-white font-bold shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
              >
                <TrendingUp className="w-4 h-4 text-current" />
                <span>Dashboard</span>
              </button>

              {user?.role === 'admin' && (
                <>
                  <button
                    id="nav-link-students"
                    onClick={() => setActiveScreen('students')}
                    className={`w-full text-left flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-all cursor-pointer ${activeScreen === 'students' ? 'bg-blue-600 text-white font-bold shadow-sm' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                  >
                    <GraduationCap className="w-4 h-4 text-current" />
                    <span>Students</span>
                  </button>

                  <button
                    id="nav-link-teachers"
                    onClick={() => setActiveScreen('teachers')}
                    className={`w-full text-left flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-all cursor-pointer ${activeScreen === 'teachers' ? 'bg-blue-600 text-white font-bold shadow-sm' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                  >
                    <Users className="w-4 h-4 text-current" />
                    <span>Teachers</span>
                  </button>

                  <button
                    id="nav-link-user-management"
                    onClick={() => setActiveScreen('user_management')}
                    className={`w-full text-left flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-all cursor-pointer ${activeScreen === 'user_management' ? 'bg-blue-600 text-white font-bold shadow-sm' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                  >
                    <UserCheck className="w-4 h-4 text-current" />
                    <span>Create Users</span>
                  </button>

                  <button
                    id="nav-link-classes"
                    onClick={() => setActiveScreen('timetable_setup')}
                    className={`w-full text-left flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-all cursor-pointer ${activeScreen === 'timetable_setup' ? 'bg-blue-600 text-white font-bold shadow-sm' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                  >
                    <Layers className="w-4 h-4 text-current" />
                    <span>Classes</span>
                  </button>

                  {/* ── NEW: Timetable Manager nav link ── */}
                  <button
                    id="nav-link-timetable-manager"
                    onClick={() => setActiveScreen('timetable_manager')}
                    className={`w-full text-left flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-all cursor-pointer ${activeScreen === 'timetable_manager' ? 'bg-blue-600 text-white font-bold shadow-sm' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                  >
                    <TableProperties className="w-4 h-4 text-current" />
                    <span>Timetable</span>
                  </button>

                  <button
                    id="nav-link-reports"
                    onClick={() => setActiveScreen('reports')}
                    className={`w-full text-left flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-all cursor-pointer ${activeScreen === 'reports' ? 'bg-blue-600 text-white font-bold shadow-sm' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                  >
                    <FileText className="w-4 h-4 text-current" />
                    <span>Reports</span>
                  </button>
                </>
              )}

              {user?.role === 'teacher' && (
                <>
                  <button
                    id="nav-link-attendance"
                    onClick={() => setActiveScreen('teacher_dash')}
                    className={`w-full text-left flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-all cursor-pointer ${activeScreen === 'attendance_marker' ? 'bg-blue-600 text-white font-bold shadow-sm' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                  >
                    <Calendar className="w-4 h-4 text-current" />
                    <span>Attendance</span>
                  </button>

                  {/* ── Teachers can view timetable read-only ── */}
                  <button
                    id="nav-link-timetable-manager-teacher"
                    onClick={() => setActiveScreen('timetable_manager')}
                    className={`w-full text-left flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-all cursor-pointer ${activeScreen === 'timetable_manager' ? 'bg-blue-600 text-white font-bold shadow-sm' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                  >
                    <TableProperties className="w-4 h-4 text-current" />
                    <span>Timetable</span>
                  </button>
                </>
              )}
            </nav>

            {/* Sidebar Footer */}
            {activeTeacher && (
              <div className="p-4 border-t border-slate-200 bg-slate-50/50">
                <div className="flex items-center gap-3 px-1">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                    {activeTeacher.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-semibold text-slate-900 truncate font-sans leading-tight">{activeTeacher.name}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-tight font-mono truncate leading-none mt-0.5">
                      {user?.role === 'admin' ? 'Administrator' : 'Faculty'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </aside>

          {/* MAIN CONTENT */}
          <main className="flex-1 overflow-y-auto flex flex-col min-w-0">

            {/* Mobile header bar */}
            <div className="lg:hidden bg-white border-b border-slate-150 px-5 py-3 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-indigo-600" />
                <span className="font-bold text-slate-800 text-sm font-sans">Hudur Attendance</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>

            {/* Screen content area */}
            <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">

              {activeScreen === 'teacher_dash' && (
                <DashboardTeacher
                  activeTeacher={activeTeacher}
                  activeDay={simulatedDay}
                  setActiveDay={setSimulatedDay}
                  timetable={timetable}
                  attendanceLogs={attendanceLogs}
                  classes={classes}
                  onStartAttendance={handleStartAttendanceLauncher}
                  teachers={teachers}
                  onAddTimetableEntry={handleAddTimetableEntry}
                  onDeleteTimetableEntry={handleDeleteTimetableEntry}
                  onUpdateTimetableEntry={handleUpdateTimetableEntry}
                />
              )}

              {activeScreen === 'attendance_marker' && activeSessionEntry && (
                <AttendanceMarker
                  session={activeSessionEntry}
                  className={classes.find(c => c.id === activeSessionEntry.classId)?.name || 'Class'}
                  students={students}
                  onSave={handleSaveAttendance}
                  onCancel={() => {
                    setActiveScreen('teacher_dash');
                    setActiveSessionId(null);
                  }}
                  existingLog={attendanceLogs.find(
                    l => l.timetableId === activeSessionEntry.id && l.date === new Date().toISOString().split('T')[0]
                  )}
                />
              )}

              {activeScreen === 'admin_dash' && (
                <DashboardAdmin
                  students={students}
                  teachers={teachers}
                  classes={classes}
                  attendanceLogs={attendanceLogs}
                  timetable={timetable}
                  simulatedDay={simulatedDay}
                  onNavigateToStudents={() => setActiveScreen('students')}
                  onNavigateToClasses={() => setActiveScreen('timetable_setup')}
                  onNavigateToTeachers={() => setActiveScreen('teachers')}
                  onNavigateToAttendance={() => setActiveScreen('teacher_dash')}
                  onAddTimetableEntry={handleAddTimetableEntry}
                  onDeleteTimetableEntry={handleDeleteTimetableEntry}
                  onUpdateTimetableEntry={handleUpdateTimetableEntry}
                  onDayChange={setSimulatedDay}
                />
              )}

              {activeScreen === 'students' && (
                <StudentDirectory
                  students={students}
                  classes={classes}
                  attendanceLogs={attendanceLogs}
                  onAddStudent={handleAddStudent}
                  onEditStudent={handleEditStudent}
                  onDeleteStudent={handleDeleteStudent}
                />
              )}

              {activeScreen === 'teachers' && (
                <TeacherDirectory
                  teachers={teachers}
                  timetable={timetable}
                  classes={classes}
                  onAddTeacher={handleAddTeacher}
                  onEditTeacher={handleEditTeacher}
                  onDeleteTeacher={handleDeleteTeacher}
                />
              )}

              {activeScreen === 'user_management' && (
                <UserManagement />
              )}

              {activeScreen === 'timetable_setup' && (
                <ClassTimetableSetup
                  classes={classes}
                  timetable={timetable}
                  teachers={teachers}
                  onAddClass={handleAddClass}
                  onDeleteClass={handleDeleteClass}
                  onAddTimetableEntry={handleAddTimetableEntry}
                  onDeleteTimetableEntry={handleDeleteTimetableEntry}
                  onUpdateTimetableEntry={handleUpdateTimetableEntry}
                />
              )}

              {/* ── NEW: Timetable Manager screen (admin edit + teacher read-only) ── */}
              {activeScreen === 'timetable_manager' && (
                <TimetableManager />
              )}

              {activeScreen === 'reports' && (
                <Reports
                  classes={classes}
                  students={students}
                  attendanceLogs={attendanceLogs}
                  timetable={timetable}
                />
              )}

            </div>
          </main>
        </div>

        {/* MOBILE DRAWER */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white w-72 h-full flex flex-col p-6 shadow-xl relative">
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 mb-8">
                <CheckSquare className="w-5 h-5 text-indigo-600" />
                <span className="font-extrabold text-slate-800 text-sm font-sans">Hudur Manager</span>
              </div>

              <nav className="flex-1 space-y-1.5">
                {user?.role === 'teacher' ? (
                  <>
                    <div className="text-[10px] font-bold text-slate-400 pb-2 uppercase tracking-wider font-mono">Daily Operations</div>
                    <button
                      onClick={() => { setActiveScreen('teacher_dash'); setMobileMenuOpen(false); }}
                      className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold ${activeScreen === 'teacher_dash' ? 'bg-slate-50 text-indigo-600 font-bold' : 'text-slate-600'}`}
                    >
                      <Calendar className="w-4 h-4" />
                      My Schedule / Timeline
                    </button>
                    <button
                      onClick={() => { setActiveScreen('timetable_manager'); setMobileMenuOpen(false); }}
                      className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold ${activeScreen === 'timetable_manager' ? 'bg-slate-50 text-indigo-600 font-bold' : 'text-slate-600'}`}
                    >
                      <TableProperties className="w-4 h-4" />
                      View Timetable
                    </button>
                  </>
                ) : (
                  <>
                    <div className="text-[10px] font-bold text-slate-400 pb-2 uppercase tracking-wider font-mono">Admin Services</div>
                    {[
                      { screen: 'admin_dash', icon: <TrendingUp className="w-4 h-4" />, label: 'Performance Analytics' },
                      { screen: 'students', icon: <GraduationCap className="w-4 h-4" />, label: 'Student Directory' },
                      { screen: 'teachers', icon: <Users className="w-4 h-4" />, label: 'Hired Faculty' },
                      { screen: 'timetable_setup', icon: <Layers className="w-4 h-4" />, label: 'Timetables & Groups' },
                      { screen: 'timetable_manager', icon: <TableProperties className="w-4 h-4" />, label: 'Timetable Manager' },
                      { screen: 'reports', icon: <FileText className="w-4 h-4" />, label: 'Audit Reports Generator' },
                    ].map(({ screen, icon, label }) => (
                      <button
                        key={screen}
                        onClick={() => { setActiveScreen(screen); setMobileMenuOpen(false); }}
                        className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold ${activeScreen === screen ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-600'}`}
                      >
                        {icon}
                        {label}
                      </button>
                    ))}
                  </>
                )}
              </nav>
            </div>
          </div>
        )}

      </div>
    </ProtectedRoute>
  );
}