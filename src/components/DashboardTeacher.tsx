import React, { useState } from 'react';
import { Teacher, TimetableEntry, AttendanceLog, ClassGroup } from '../types';
import { Calendar, Clock, CheckCircle2, AlertCircle, ArrowRight, UserCheck, BookOpen, Clock3, MapPin, Sparkles, X, Info } from 'lucide-react';
import InteractiveTimetableBox from './InteractiveTimetableBox';

interface DashboardTeacherProps {
  activeTeacher: Teacher;
  activeDay: string; // e.g. 'Monday', 'Tuesday', etc.
  setActiveDay: (day: string) => void;
  timetable: TimetableEntry[];
  attendanceLogs: AttendanceLog[];
  classes: ClassGroup[];
  onStartAttendance: (timetableId: string) => void;
  teachers: Teacher[];
  onAddTimetableEntry: (entry: Omit<TimetableEntry, 'id'>) => void;
  onDeleteTimetableEntry: (entryId: string) => void;
  onUpdateTimetableEntry: (entry: TimetableEntry) => void;
}

export default function DashboardTeacher({
  activeTeacher,
  activeDay,
  setActiveDay,
  timetable,
  attendanceLogs,
  classes,
  onStartAttendance,
  teachers,
  onAddTimetableEntry,
  onDeleteTimetableEntry,
  onUpdateTimetableEntry
}: DashboardTeacherProps) {
  // Modal state handlers
  const [showMyAttendanceModal, setShowMyAttendanceModal] = useState(false);
  const [showTimetableModal, setShowTimetableModal] = useState(false);

  // Get all timetable entries for the simulated day and active teacher
  const todaysSchedule = timetable.filter(
    e => e.teacherId === activeTeacher.id && e.dayOfWeek === activeDay
  );

  // Helper to check if a class session has already been marked today
  const getAttendanceLogForSession = (timetableId: string) => {
    return attendanceLogs.find(log => log.timetableId === timetableId);
  };

  const markedCount = todaysSchedule.filter(e => !!getAttendanceLogForSession(e.id)).length;
  const pendingCount = todaysSchedule.length - markedCount;

  // Find the next upcoming session that hasn't been marked
  const nextPendingSession = todaysSchedule.find(e => !getAttendanceLogForSession(e.id));

  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  // Calculate generic active stats for the "My Attendance" modal
  const completedStats = attendanceLogs.filter(log => {
    const entry = timetable.find(e => e.id === log.timetableId);
    return entry && entry.teacherId === activeTeacher.id;
  });

  return (
    <div id="teacher-dashboard" className="space-y-5">
      
      {/* Upper Grid: Welcome Greeting & Today's Schedule Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Aspect: Good morning & Action triggers (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2 py-0.5 rounded border border-blue-100 uppercase tracking-wider">
                Faculty Workspace
              </span>
              <h1 className="text-xl sm:text-2xl font-bold mt-2 text-slate-900 tracking-tight">
                Good Morning, {activeTeacher.name.split(' ')[0]}!
              </h1>
              <p className="text-slate-500 mt-0.5 max-w-md text-xs font-normal leading-relaxed">
                You are assigned to the <span className="font-semibold text-slate-800">{activeTeacher.department}</span> department. Here are your quick actions for today.
              </p>
            </div>

            {/* Sandbox Notice */}
            <div className="flex items-start gap-2 bg-slate-50 border border-slate-150 p-3 rounded-lg text-xs text-slate-650">
              <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                Using the <span className="font-semibold text-slate-800">Active Day Filter</span>, you can simulate alternate weekdays to view or mark schedules.
              </div>
            </div>
          </div>

          {/* Large Action Buttons (Requested SaaS design) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
            <button
              onClick={() => {
                if (nextPendingSession) {
                  onStartAttendance(nextPendingSession.id);
                } else if (todaysSchedule.length > 0) {
                  alert("All scheduled sessions for today have been fully marked!");
                } else {
                  alert(`No assigned lectures found for ${activeDay}. Switch weekdays below.`);
                }
              }}
              className="group flex flex-col justify-between p-4 rounded-lg border border-slate-205 bg-blue-600 text-white hover:bg-blue-700 hover:border-blue-700 transition-all text-left shadow-3xs select-none cursor-pointer"
            >
              <UserCheck className="w-5 h-5 text-white/95 mb-5" />
              <div>
                <span className="block text-[10px] font-extrabold text-white/80 uppercase tracking-wider font-mono">Launch</span>
                <span className="block text-sm font-bold mt-0.5">Mark Attendance</span>
              </div>
            </button>

            <button
              onClick={() => setShowMyAttendanceModal(true)}
              className="flex flex-col justify-between p-4 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-all text-left shadow-3xs select-none cursor-pointer"
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-600 mb-5" />
              <div>
                <span className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider font-mono">Metrics</span>
                <span className="block text-sm font-bold text-slate-800 mt-0.5">My Attendance</span>
              </div>
            </button>

            <button
              onClick={() => setShowTimetableModal(true)}
              className="flex flex-col justify-between p-4 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-all text-left shadow-3xs select-none cursor-pointer"
            >
              <Calendar className="w-5 h-5 text-blue-600 mb-5" />
              <div>
                <span className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider font-mono">Overview</span>
                <span className="block text-sm font-bold text-slate-800 mt-0.5">View Timetable</span>
              </div>
            </button>
          </div>
        </div>

        {/* Right Aspect: Today's Classes List (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg p-5 shadow-xs flex flex-col">
          <div className="pb-2.5 border-b border-slate-150 flex items-center justify-between mb-3.5">
            <h3 className="font-bold text-slate-905 text-sm tracking-tight">Today's Classes</h3>
            <span className="text-[11px] font-semibold text-slate-400 font-mono bg-slate-50 px-2 py-0.5 rounded border border-slate-200 uppercase tracking-tight">
              {activeDay}
            </span>
          </div>

          <div className="flex-1 space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
            {todaysSchedule.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <Clock3 className="w-8 h-8 text-slate-300 mb-1.5" />
                <p className="text-xs font-semibold">No classes scheduled today</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Select an alternate day to view timetables.</p>
              </div>
            ) : (
              todaysSchedule
                .sort((a, b) => a.startTime.localeCompare(b.startTime))
                .map((session) => {
                  const logExists = !!getAttendanceLogForSession(session.id);
                  const clsObj = classes.find(c => c.id === session.classId);
                  
                  return (
                    <div
                      key={session.id}
                      onClick={() => onStartAttendance(session.id)}
                      className="p-2.5 bg-slate-50 hover:bg-blue-50/40 border border-slate-150 hover:border-blue-200 rounded-lg flex items-center justify-between gap-3 transition-all cursor-pointer group"
                    >
                      <div className="font-mono text-sm tracking-tight font-bold text-slate-800 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600" />
                        <span>{session.startTime}</span>
                        <span className="text-slate-300 text-xs font-normal">|</span>
                        <span className="text-slate-600 font-sans font-medium text-xs">
                          {clsObj ? clsObj.name : 'Class'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-600 hidden sm:inline truncate max-w-[120px]">
                          {session.courseName}
                        </span>
                        {logExists ? (
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[9px] font-bold px-2 py-0.5 rounded uppercase scale-95">
                            Saved
                          </span>
                        ) : (
                          <span className="bg-amber-50 text-amber-700 border border-amber-100 text-[9px] font-bold px-2 py-0.5 rounded uppercase scale-95 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-colors">
                            Take
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>

      </div>

      {/* Weekday Selector Widget */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3.5">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 font-sans">
            <Calendar className="w-4 h-4 text-blue-600" />
            Active Day Filter
          </span>
          <span className="text-xs text-slate-400 font-sans font-light">Toggle between days to review schedules instantly</span>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {weekDays.map((day) => (
            <button
              key={day}
              onClick={() => setActiveDay(day)}
              className={`py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                activeDay === day
                  ? 'bg-blue-600 text-white shadow-3xs'
                  : 'bg-slate-50 hover:bg-slate-100/75 text-slate-650 border border-slate-200/60'
              }`}
            >
              {day.substring(0, 3)}
              <span className="hidden sm:inline-block font-medium text-[11px] opacity-80 block mt-0.5">
                {day.substring(3)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-3xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest font-mono">Total Classes ({activeDay})</span>
            <div className="text-2xl font-black text-slate-800 mt-1 font-sans">{todaysSchedule.length}</div>
          </div>
          <div className="bg-slate-50 text-slate-500 p-2.5 rounded-md border border-slate-200">
            <BookOpen className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-3xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest font-mono">Marked Lectures</span>
            <div className="text-2xl font-black text-emerald-600 mt-1 font-sans">{markedCount}</div>
          </div>
          <div className="bg-emerald-50 text-emerald-600 p-2.5 rounded-md border border-emerald-100">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-3xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest font-mono">Pending Lectures</span>
            <div className="text-2xl font-black text-amber-500 mt-1 font-sans">{pendingCount}</div>
          </div>
          <div className="bg-amber-50 text-amber-600 p-2.5 rounded-md border border-amber-100">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Today's Full Timeline Schedule with Visual Logs details */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-3xs">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="font-bold text-slate-900 text-sm font-sans">
            Lecture Timeline / {activeDay}
          </h2>
          <p className="text-[11px] text-slate-400 font-sans mt-0.5">Comprehensive chronological ledger of classes</p>
        </div>
        <div className="divide-y divide-slate-150">
          {todaysSchedule.length === 0 ? (
            <div className="p-10 text-center text-slate-400 text-sm font-sans">
              No assigned classes returned on {activeDay} for {activeTeacher.name}.
            </div>
          ) : (
            todaysSchedule
              .sort((a, b) => a.startTime.localeCompare(b.startTime))
              .map((session) => {
                const log = getAttendanceLogForSession(session.id);
                const className = classes.find(c => c.id === session.classId)?.name || 'Class';
                
                return (
                  <div key={session.id} className="p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-start gap-3.5">
                      {/* Left time slot */}
                      <div className="flex flex-col items-center bg-slate-50 border border-slate-200 rounded-lg p-2 min-w-[70px] text-center shadow-3xs">
                        <Clock className="w-3.5 h-3.5 text-blue-600 mb-0.5" />
                        <span className="text-xs font-bold text-slate-800 font-mono">{session.startTime}</span>
                        <span className="text-[9px] text-slate-400 font-mono mt-0.5">{session.endTime}</span>
                      </div>

                      {/* Course text details */}
                      <div>
                        <h4 className="font-bold text-slate-900 text-xs sm:text-sm font-sans">{session.courseName}</h4>
                        <p className="text-xs text-slate-500 font-sans mt-0.5 leading-relaxed">
                          Class: <span className="font-semibold text-slate-700">{className}</span> • Room: <span className="font-mono text-slate-600">{session.room}</span>
                        </p>
                        {session.status && session.status !== 'Active' && (
                          <span className="inline-block mt-1 bg-red-50 text-red-650 text-[10px] font-semibold px-2 py-0.5 rounded-sm">
                            Status: {session.status}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action trigger button */}
                    <div className="flex items-center gap-3 self-end sm:self-center">
                      {log ? (
                        <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 px-3 py-1 rounded-lg border border-emerald-100 text-xs">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <div className="text-left">
                            <div className="text-[9px] font-bold uppercase font-mono tracking-wider text-emerald-800">Saved Log</div>
                            <div className="text-[9px] text-emerald-600 leading-none">
                              {log.records.filter(r => r.status === 'Present').length} P • {log.records.filter(r => r.status === 'Absent').length} A
                            </div>
                          </div>
                          
                          <button
                            onClick={() => onStartAttendance(session.id)}
                            className="bg-white hover:bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-200 ml-1.5 transition-colors"
                          >
                            Edit
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => onStartAttendance(session.id)}
                          className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white border border-transparent px-3 py-1.5 rounded-lg text-xs font-bold shadow-3xs transition-colors cursor-pointer select-none animate-pulse-once"
                        >
                          <UserCheck className="w-3.5 h-3.5 text-white/95" />
                          Mark Attendance
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
          )}
        </div>
      </div>

      {/* Unified Multi-mode Interactive Timetable & Holidays Box */}
      <InteractiveTimetableBox
        classes={classes}
        timetable={timetable}
        teachers={teachers}
        currentRole="teacher"
        onAddTimetableEntry={onAddTimetableEntry}
        onDeleteTimetableEntry={onDeleteTimetableEntry}
        onUpdateTimetableEntry={onUpdateTimetableEntry}
        activeDay={activeDay}
        setActiveDay={setActiveDay}
      />

      {/* MODAL 1: MY ATTENDANCE SUMMARY DIALOG */}
      {showMyAttendanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg max-w-sm w-full shadow-lg overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
            <div className="border-b border-slate-200 px-5 py-3.5 flex items-center justify-between">
              <h3 className="font-bold text-slate-950 text-sm font-sans flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                My Session Attendance Log
              </h3>
              <button onClick={() => setShowMyAttendanceModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 space-y-4">
              <div className="text-center py-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block font-mono">Lectures Logged</span>
                <span className="text-3xl font-black text-slate-800 mt-1 block">{completedStats.length}</span>
                <p className="text-[10px] text-slate-450 mt-1 px-2.5">
                  Historical sandbox log count recorded across the complete institutional workspace.
                </p>
              </div>

              <div className="space-y-1.5">
                <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider font-mono">Current Sandbox Faculty Info</h4>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1 text-xs text-slate-750">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Department:</span>
                    <span className="font-semibold text-slate-805">{activeTeacher.department}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Employee SKU:</span>
                    <span className="font-mono text-slate-805">{activeTeacher.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Assigned Weekdays:</span>
                    <span className="font-semibold text-slate-805">Monday - Friday</span>
                  </div>
                </div>
              </div>

              <p className="text-[10px] text-slate-400 text-center leading-relaxed">
                Registered metrics are fully persisted within active browser session state Fallback local storage dictionary.
              </p>
            </div>

            <div className="bg-slate-50 border-t border-slate-200 px-5 py-3 flex justify-end">
              <button
                onClick={() => setShowMyAttendanceModal(false)}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer"
              >
                Close Metrics Check
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: VIEW TIMETABLE MATRIX */}
      {showTimetableModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full shadow-lg overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
            <div className="border-b border-slate-200 px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-slate-950 text-sm font-sans">
                  Active Faculty Timetable Map ({activeTeacher.name})
                </h3>
              </div>
              <button onClick={() => setShowTimetableModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                    <th className="p-2">Time Period</th>
                    <th className="p-2">Monday</th>
                    <th className="p-2">Tuesday</th>
                    <th className="p-2">Wednesday</th>
                    <th className="p-2">Thursday</th>
                    <th className="p-2">Friday</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {['09:00 - 10:00', '10:00 - 11:00', '11:00 - 12:00', '13:00 - 14:00'].map((timeSlot) => (
                    <tr key={timeSlot} className="hover:bg-slate-50/50">
                      <td className="p-2 font-bold text-slate-700 font-mono">{timeSlot}</td>
                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day) => {
                        const cellEntry = timetable.find(
                          e => e.teacherId === activeTeacher.id && 
                               e.dayOfWeek === day && 
                               e.startTime.substring(0, 5) === timeSlot.substring(0, 5)
                        );
                        
                        return (
                          <td key={day} className="p-2">
                            {cellEntry ? (
                              <div className="bg-blue-50/75 border border-blue-150 p-1 rounded text-[10px]">
                                <span className="font-bold text-blue-900 block truncate">{cellEntry.courseName}</span>
                                <span className="text-blue-700 text-[9px] block mt-0.5 font-mono truncate">
                                  {classes.find(c => c.id === cellEntry.classId)?.name || 'Class'} (R: {cellEntry.room})
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-300 font-light font-mono text-[10px]">-</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mt-4 flex items-center gap-1.5 bg-slate-50 p-2.5 rounded-lg border border-slate-150 text-[10px] text-slate-500 font-light leading-relaxed">
                <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>You can edit or declare new courses inside the <span className="font-semibold text-slate-700">Classes & Timetables</span> page in Administration controls.</span>
              </div>
            </div>

            <div className="bg-slate-50 border-t border-slate-200 px-5 py-3 flex justify-end">
              <button
                onClick={() => setShowTimetableModal(false)}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer"
              >
                Close Grid View
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
