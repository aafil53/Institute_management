import React, { useState, useEffect } from 'react';
import { Student, Teacher, ClassGroup, TimetableEntry, AttendanceLog } from './types';
import { 
  INITIAL_CLASSES, 
  INITIAL_TEACHERS, 
  INITIAL_STUDENTS, 
  INITIAL_TIMETABLE, 
  INITIAL_ATTENDANCE_LOGS 
} from './initialData';

// Context & Auth Imports
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Component Imports
import DashboardTeacher from './components/DashboardTeacher';
import AttendanceMarker from './components/AttendanceMarker';
import DashboardAdmin from './components/DashboardAdmin';
import StudentDirectory from './components/StudentDirectory';
import TeacherDirectory from './components/TeacherDirectory';
import ClassTimetableSetup from './components/ClassTimetableSetup';
import Reports from './components/Reports';
import Navigation from './components/Navigation';

// Lucide Icons
import { 
  BookOpen, 
  Users, 
  Calendar, 
  FileText, 
  TrendingUp, 
  Layers, 
  GraduationCap, 
  UserCheck, 
  RefreshCw, 
  CheckSquare, 
  Menu, 
  X, 
  ShieldAlert, 
  Sparkles,
  Award
} from 'lucide-react';

export default function App() {
  const { user } = useAuth();

  // Mobile navigation drawer toggle
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Selected day for timetable views
  const [simulatedDay, setSimulatedDay] = useState<string>(() => {
    // default to current weekday name, falling back to 'Monday' if weekend
    const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDay = weekDays[new Date().getDay()];
    if (currentDay === 'Sunday' || currentDay === 'Saturday') {
      return 'Monday';
    }
    return currentDay;
  });

  // State engines with localStorage persistence fallback
  const [classes, setClasses] = useState<ClassGroup[]>(() => {
    const raw = localStorage.getItem('hudur_classes');
    return raw ? JSON.parse(raw) : INITIAL_CLASSES;
  });

  const [teachers, setTeachers] = useState<Teacher[]>(() => {
    const raw = localStorage.getItem('hudur_teachers');
    return raw ? JSON.parse(raw) : INITIAL_TEACHERS;
  });

  const [students, setStudents] = useState<Student[]>(() => {
    const raw = localStorage.getItem('hudur_students');
    return raw ? JSON.parse(raw) : INITIAL_STUDENTS;
  });

  const [timetable, setTimetable] = useState<TimetableEntry[]>(() => {
    const raw = localStorage.getItem('hudur_timetable');
    return raw ? JSON.parse(raw) : INITIAL_TIMETABLE;
  });

  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceLog[]>(() => {
    const raw = localStorage.getItem('hudur_attendance_logs');
    return raw ? JSON.parse(raw) : INITIAL_ATTENDANCE_LOGS;
  });

  // Active view routing selectors
  // 'teacher_dash' | 'attendance_marker' | 'admin_dash' | 'students' | 'teachers' | 'timetable_setup' | 'reports'
  const [activeScreen, setActiveScreen] = useState<string>('teacher_dash');
  
  // Selected schedule entry ID to load in attendance marker
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // Sync state variables to localStorage upon mutation reactive triggers
  useEffect(() => {
    localStorage.setItem('hudur_classes', JSON.stringify(classes));
  }, [classes]);

  useEffect(() => {
    localStorage.setItem('hudur_teachers', JSON.stringify(teachers));
  }, [teachers]);

  useEffect(() => {
    localStorage.setItem('hudur_students', JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem('hudur_timetable', JSON.stringify(timetable));
  }, [timetable]);

  useEffect(() => {
    localStorage.setItem('hudur_attendance_logs', JSON.stringify(attendanceLogs));
  }, [attendanceLogs]);

  // Adjust active screen dynamically upon role updates
  const handleRoleChange = (role: 'teacher' | 'admin') => {
    setMobileMenuOpen(false);
    if (role === 'teacher') {
      setActiveScreen('teacher_dash');
    } else {
      setActiveScreen('admin_dash');
    }
  };

  // Reset sandbox databases
  const handleResetSandbox = () => {
    if (confirm('Verify: Reset sandbox databases back to default seed logs? This discards all customized student records, teachers, and logs recorded during this preview SESSION.')) {
      setClasses(INITIAL_CLASSES);
      setTeachers(INITIAL_TEACHERS);
      setStudents(INITIAL_STUDENTS);
      setTimetable(INITIAL_TIMETABLE);
      setAttendanceLogs(INITIAL_ATTENDANCE_LOGS);
      
      // route default
      setActiveScreen(user?.role === 'admin' ? 'admin_dash' : 'teacher_dash');
      setMobileMenuOpen(false);
      
      alert('Sandbox reset successful!');
    }
  };

  // Student directory operations
  const handleAddStudent = (newStud: Omit<Student, 'id'>) => {
    const studentWithId: Student = {
      ...newStud,
      id: `stud-${Date.now()}`
    };
    setStudents(prev => [studentWithId, ...prev]);
  };

  const handleEditStudent = (updatedStud: Student) => {
    setStudents(prev => prev.map(s => s.id === updatedStud.id ? updatedStud : s));
  };

  const handleDeleteStudent = (studentId: string) => {
    setStudents(prev => prev.filter(s => s.id !== studentId));
  };

  // Teacher directory operations
  const handleAddTeacher = (newTeach: Omit<Teacher, 'id'>) => {
    const teacherWithId: Teacher = {
      ...newTeach,
      id: `teach-${Date.now()}`
    };
    setTeachers(prev => [teacherWithId, ...prev]);
  };

  const handleEditTeacher = (updatedTeach: Teacher) => {
    setTeachers(prev => prev.map(t => t.id === updatedTeach.id ? updatedTeach : t));
  };

  const handleDeleteTeacher = (teacherId: string) => {
    setTeachers(prev => prev.filter(t => t.id !== teacherId));
    // clear scheduling mappings referencing old deleted teacher to prevent layout crashes
    setTimetable(prev => prev.filter(e => e.teacherId !== teacherId));
  };

  // Class section operations
  const handleAddClass = (newCls: Omit<ClassGroup, 'id'>) => {
    const classWithId: ClassGroup = {
      ...newCls,
      id: `class-${Date.now()}`
    };
    setClasses(prev => [...prev, classWithId]);
  };

  const handleDeleteClass = (classId: string) => {
    setClasses(prev => prev.filter(c => c.id !== classId));
    setTimetable(prev => prev.filter(e => e.classId !== classId));
    setStudents(prev => prev.filter(s => s.classId !== classId));
  };

  // Timetable Operations
  const handleAddTimetableEntry = (newEntry: Omit<TimetableEntry, 'id'>) => {
    const entryWithId: TimetableEntry = {
      ...newEntry,
      id: `t-entry-${Date.now()}`
    };
    setTimetable(prev => [...prev, entryWithId]);
  };

  const handleDeleteTimetableEntry = (entryId: string) => {
    setTimetable(prev => prev.filter(e => e.id !== entryId));
  };

  const handleUpdateTimetableEntry = (updatedEntry: TimetableEntry) => {
    setTimetable(prev => prev.map(e => e.id === updatedEntry.id ? updatedEntry : e));
  };

  // Attendance Auditing Submit & Update
  const handleSaveAttendance = (newLog: AttendanceLog) => {
    setAttendanceLogs(prev => {
      // check if log already exists for this timetable segment + date
      const existsIdx = prev.findIndex(l => l.timetableId === newLog.timetableId && l.date === newLog.date);
      if (existsIdx !== -1) {
        // update existing indices
        const updated = [...prev];
        updated[existsIdx] = newLog;
        return updated;
      }
      return [newLog, ...prev];
    });

    // Send back to dashboard
    setActiveScreen('teacher_dash');
    setActiveSessionId(null);
  };

  // Active physical entities
  const activeTeacher = user?.role === 'teacher' 
    ? teachers.find(t => t.id === user?.departmentOrId) || teachers[0]
    : teachers[0];
  const activeSessionEntry = timetable.find(e => e.id === activeSessionId);

  // Quick launching trigger
  const handleStartAttendanceLauncher = (timetableId: string) => {
    setActiveSessionId(timetableId);
    setActiveScreen('attendance_marker');
  };

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
              <p className="text-[10px] text-slate-405 font-mono uppercase tracking-widest leading-none mt-0.5">Hudur Institute</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-4 py-5 space-y-5 overflow-y-auto">
            <div className="space-y-1">
              {/* Dashboard Link */}
              <button
                id="nav-link-dashboard"
                onClick={() => {
                  if (user?.role === 'teacher') {
                    setActiveScreen('teacher_dash');
                  } else {
                    setActiveScreen('admin_dash');
                  }
                }}
                className={`w-full text-left flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-all cursor-pointer ${
                  activeScreen === 'teacher_dash' || activeScreen === 'admin_dash'
                    ? 'bg-blue-600 text-white font-bold shadow-sm'
                    : 'text-slate-650 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <TrendingUp className="w-4 h-4 text-current" />
                <span>Dashboard</span>
              </button>

              {/* Students Directory Link - Admin Only */}
              {user?.role === 'admin' && (
                <button
                  id="nav-link-students"
                  onClick={() => setActiveScreen('students')}
                  className={`w-full text-left flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-all cursor-pointer ${
                    activeScreen === 'students'
                      ? 'bg-blue-600 text-white font-bold shadow-sm'
                      : 'text-slate-650 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <GraduationCap className="w-4 h-4 text-current" />
                  <span>Students</span>
                </button>
              )}

              {/* Teachers Link - Admin Only */}
              {user?.role === 'admin' && (
                <button
                  id="nav-link-teachers"
                  onClick={() => setActiveScreen('teachers')}
                  className={`w-full text-left flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-all cursor-pointer ${
                    activeScreen === 'teachers'
                      ? 'bg-blue-600 text-white font-bold shadow-sm'
                      : 'text-slate-650 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Users className="w-4 h-4 text-current" />
                  <span>Teachers</span>
                </button>
              )}

              {/* Classes Setup Link - Admin Only */}
              {user?.role === 'admin' && (
                <button
                  id="nav-link-classes"
                  onClick={() => setActiveScreen('timetable_setup')}
                  className={`w-full text-left flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-all cursor-pointer ${
                    activeScreen === 'timetable_setup'
                      ? 'bg-blue-600 text-white font-bold shadow-sm'
                      : 'text-slate-650 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Layers className="w-4 h-4 text-current" />
                  <span>Classes</span>
                </button>
              )}

              {/* Attendance Timeline link - Teacher */}
              {user?.role === 'teacher' && (
                <button
                  id="nav-link-attendance"
                  onClick={() => setActiveScreen('teacher_dash')}
                  className={`w-full text-left flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-all cursor-pointer ${
                    activeScreen === 'attendance_marker'
                      ? 'bg-blue-600 text-white font-bold shadow-sm'
                      : 'text-slate-650 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Calendar className="w-4 h-4 text-current" />
                  <span>Attendance</span>
                </button>
              )}

              {/* Reports Link - Admin Only */}
              {user?.role === 'admin' && (
                <button
                  id="nav-link-reports"
                  onClick={() => setActiveScreen('reports')}
                  className={`w-full text-left flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-all cursor-pointer ${
                    activeScreen === 'reports'
                      ? 'bg-blue-600 text-white font-bold shadow-sm'
                      : 'text-slate-650 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-4 h-4 text-current" />
                  <span>Reports</span>
                </button>
              )}
            </div>
          </nav>

          {/* User Profile Footer & Simple Settings Sandbox controller */}
          <div className="p-4 border-t border-slate-200 bg-slate-50/50 space-y-3">
            <div className="flex items-center gap-3 px-1">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white border border-blue-500 flex items-center justify-center font-bold text-xs uppercase shadow-xs">
                {activeTeacher.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-slate-900 truncate font-sans leading-tight">{activeTeacher.name}</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-tight font-mono truncate leading-none mt-0.5">
                  {user?.role === 'admin' ? 'Administrator' : 'Faculty'}
                </p>
              </div>
            </div>
            
            <button
              onClick={handleResetSandbox}
              title="Reset sandbox to original logs dictionary"
              className="w-full flex items-center justify-center gap-1.5 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 text-[11px] py-1.5 rounded-md transition-all font-semibold font-sans cursor-pointer select-none shadow-3xs"
            >
              <RefreshCw className="w-3 h-3 text-slate-400" />
              Reset App Data
            </button>
          </div>
        </aside>

        {/* CONTAINER SHELL CONTENT */}
        <main className="flex-1 overflow-y-auto flex flex-col min-w-0">
          
          {/* Mobile Shell Header bar */}
          <div className="lg:hidden bg-white border-b border-slate-150 px-5 py-3 flex items-center justify-between shadow-3xs">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-indigo-600" />
              <span className="font-bold text-slate-800 text-sm font-sans">Hudur Attendance</span>
            </div>
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-1.5 bg-slate-50 border border-slate-202 rounded-lg text-slate-700"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>

          {/* Core Layout Inner Area */}
          <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
            
            {/* SCREEN 1: Teacher Dashboard Timeline */}
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

            {/* SCREEN 2: Attendance Marking Console (Teacher) */}
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

            {/* SCREEN 3: Admin Analytics Dashboard */}
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
                onNavigateToAttendance={() => {
  setActiveScreen('teacher_dash');
}}
                onAddTimetableEntry={handleAddTimetableEntry}
                onDeleteTimetableEntry={handleDeleteTimetableEntry}
                onUpdateTimetableEntry={handleUpdateTimetableEntry}
                onDayChange={setSimulatedDay}
              />
            )}

            {/* SCREEN 4: Student Directory Dashboard */}
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

            {/* SCREEN 5: Teacher Directory Ledger */}
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

            {/* SCREEN 6: Timetable & Classes Setup Schedules planner */}
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

            {/* SCREEN 7: Structured Institutional Reports printer */}
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

      {/* MOBILE COLLAPSIBLE DRAWER PORTAL */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-72 h-full flex flex-col p-6 shadow-xl relative animate-slide-right">
            
            {/* Close toggle button */}
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-8">
              <CheckSquare className="w-5 h-5 text-indigo-650" />
              <span className="font-extrabold text-slate-800 text-sm font-sans">Hudur Manager</span>
            </div>

            <nav className="flex-1 space-y-1.5">
              {user?.role === 'teacher' ? (
                <>
                  <div className="text-[10px] font-bold text-slate-400 pb-2 uppercase tracking-wider font-mono">
                    Daily Operations
                  </div>
                  <button
                    onClick={() => { setActiveScreen('teacher_dash'); setMobileMenuOpen(false); }}
                    className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold ${
                      activeScreen === 'teacher_dash' ? 'bg-slate-50 text-indigo-600 font-bold' : 'text-slate-600'
                    }`}
                  >
                    <Calendar className="w-4 h-4" />
                    My Schedule / Timeline
                  </button>
                </>
              ) : (
                <>
                  <div className="text-[10px] font-bold text-slate-400 pb-2 uppercase tracking-wider font-mono">
                    Admin Services
                  </div>
                  <button
                    onClick={() => { setActiveScreen('admin_dash'); setMobileMenuOpen(false); }}
                    className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold ${
                      activeScreen === 'admin_dash' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-600'
                    }`}
                  >
                    <TrendingUp className="w-4 h-4" />
                    Performance Analytics
                  </button>
                  <button
                    onClick={() => { setActiveScreen('students'); setMobileMenuOpen(false); }}
                    className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold ${
                      activeScreen === 'students' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-600'
                    }`}
                  >
                    <GraduationCap className="w-4 h-4" />
                    Student Directory
                  </button>
                  <button
                    onClick={() => { setActiveScreen('teachers'); setMobileMenuOpen(false); }}
                    className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold ${
                      activeScreen === 'teachers' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-600'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    Hired Faculty
                  </button>
                  <button
                    onClick={() => { setActiveScreen('timetable_setup'); setMobileMenuOpen(false); }}
                    className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold ${
                      activeScreen === 'timetable_setup' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-600'
                    }`}
                  >
                    <Layers className="w-4 h-4" />
                    Timetables & Groups
                  </button>
                  <button
                    onClick={() => { setActiveScreen('reports'); setMobileMenuOpen(false); }}
                    className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold ${
                      activeScreen === 'reports' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-600'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    Audit Reports Generator
                  </button>
                </>
              )}
            </nav>

            <div className="pt-6 border-t border-slate-100">
              <button
                onClick={handleResetSandbox}
                className="w-full flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 text-xs px-3.5 py-2 rounded-xl transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reset Sandbox
              </button>
            </div>

          </div>
        </div>
      )}

      </div>
    </ProtectedRoute>
  );
}
