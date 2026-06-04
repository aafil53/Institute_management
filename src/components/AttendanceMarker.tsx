import React, { useState, useEffect } from 'react';
import { Student, TimetableEntry, AttendanceLog, AttendanceStatus, StudentAttendanceRecord } from '../types';
import { Check, X, Clock, ShieldAlert, ArrowLeft, CheckSquare, Save, Users } from 'lucide-react';

interface AttendanceMarkerProps {
  session: TimetableEntry;
  className: string;
  students: Student[];
  onSave: (log: AttendanceLog) => void;
  onCancel: () => void;
  existingLog?: AttendanceLog;
}

export default function AttendanceMarker({
  session,
  className,
  students,
  onSave,
  onCancel,
  existingLog
}: AttendanceMarkerProps) {
  // Get active student body enrolled in this class group 
  const classStudents = students.filter(s => s.classId === session.classId && s.isActive);

  // Status mapping and tracking
  const [records, setRecords] = useState<Record<string, { status: AttendanceStatus; note: string }>>({});

  useEffect(() => {
    const initialRecords: Record<string, { status: AttendanceStatus; note: string }> = {};
    
    classStudents.forEach(student => {
      if (existingLog) {
        const found = existingLog.records.find(r => r.studentId === student.id);
        if (found) {
          initialRecords[student.id] = {
            status: found.status,
            note: found.note || ''
          };
          return;
        }
      }
      
      // Default initial status is Present
      initialRecords[student.id] = {
        status: 'Present',
        note: ''
      };
    });

    setRecords(initialRecords);
  }, [existingLog, session.classId, students]);

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setRecords(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status
      }
    }));
  };

  const handleNoteChange = (studentId: string, note: string) => {
    setRecords(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        note
      }
    }));
  };

  // Shortcut to mark everyone Present instantly
  const handleMarkAllPresent = () => {
    const updated = { ...records };
    classStudents.forEach(s => {
      updated[s.id] = {
        status: 'Present',
        note: updated[s.id]?.note || ''
      };
    });
    setRecords(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const finalRecords: StudentAttendanceRecord[] = classStudents.map(student => {
      const record = records[student.id] || { status: 'Present', note: '' };
      return {
        studentId: student.id,
        studentName: student.name,
        status: record.status,
        note: record.note
      };
    });

    const newLog: AttendanceLog = {
      id: existingLog?.id || `log-${Date.now()}`,
      date: existingLog?.date || new Date().toISOString().split('T')[0],
      classId: session.classId,
      timetableId: session.id,
      courseName: session.courseName,
      teacherId: session.teacherId,
      markedAt: new Date().toISOString(),
      records: finalRecords
    };

    onSave(newLog);
  };

  // Compile totals for real-time statistical readouts
  const totalStudents = classStudents.length;
  let presentCount = 0;
  let absentCount = 0;
  let lateCount = 0;
  let excusedCount = 0;

  classStudents.forEach(s => {
    const stat = records[s.id]?.status;
    if (stat === 'Present') presentCount++;
    else if (stat === 'Absent') absentCount++;
    else if (stat === 'Late') lateCount++;
    else if (stat === 'Excused') excusedCount++;
  });

  return (
    <div id="attendance-marker" className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      
      {/* Top Header Card */}
      <div className="border-b border-slate-200 bg-slate-50/50 p-6">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors mb-4 cursor-pointer select-none"
        >
          <ArrowLeft className="w-4 h-4" />
          Cancel and Go Back
        </button>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-md border border-blue-150 uppercase tracking-wider">
                Marking Attendance
              </span>
              <span className="text-xs text-slate-450 font-mono font-semibold">
                Class: <span className="text-slate-800 font-bold">{className}</span>
              </span>
              <span className="text-xs text-slate-300">•</span>
              <span className="text-[#0f172a] text-xs font-mono font-bold">
                Date: {existingLog?.date || new Date().toISOString().split('T')[0]}
              </span>
            </div>
            
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-2 font-sans tracking-tight">
              {session.courseName}
            </h1>
            
            <p className="text-xs sm:text-sm text-slate-550 font-sans mt-1">
              Lecture Schedule: <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded font-bold text-slate-705">{session.startTime} - {session.endTime}</span> • Room: <span className="font-semibold text-slate-700">{session.room}</span>
            </p>
          </div>

          <button
            type="button"
            onClick={handleMarkAllPresent}
            id="mark-all-present-btn"
            className="bg-white hover:bg-slate-50 text-blue-600 border border-blue-200 text-xs font-bold px-4 py-2.5 rounded-lg shadow-3xs transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            <CheckSquare className="w-4 h-4 text-blue-600" />
            Mark All Present
          </button>
        </div>
      </div>

      {/* Floating Counter Row */}
      <div className="grid grid-cols-4 border-b border-slate-200 bg-white">
        <div className="text-center py-3.5 border-r border-slate-100">
          <div className="text-base font-extrabold text-emerald-600 font-mono leading-none">{presentCount}</div>
          <div className="text-[10px] text-slate-450 uppercase tracking-wider font-bold mt-1">🟢 Present</div>
        </div>
        <div className="text-center py-3.5 border-r border-slate-100">
          <div className="text-base font-extrabold text-red-600 font-mono leading-none">{absentCount}</div>
          <div className="text-[10px] text-slate-450 uppercase tracking-wider font-bold mt-1">🔴 Absent</div>
        </div>
        <div className="text-center py-3.5 border-r border-slate-100">
          <div className="text-base font-extrabold text-amber-500 font-mono leading-none">{lateCount}</div>
          <div className="text-[10px] text-slate-450 uppercase tracking-wider font-bold mt-1">🟡 Late</div>
        </div>
        <div className="text-center py-3.5">
          <div className="text-base font-extrabold text-blue-600 font-mono leading-none">{excusedCount}</div>
          <div className="text-[10px] text-slate-450 uppercase tracking-wider font-bold mt-1">🔵 Excused</div>
        </div>
      </div>

      {/* Interactive Form */}
      <form onSubmit={handleSubmit}>
        {totalStudents === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm font-sans">
            No active students are currently listed in Class {className}.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-extrabold text-slate-450 uppercase tracking-widest border-b border-slate-200">
                  <th className="px-6 py-4.5 w-1/12 min-w-[60px]">Roll No</th>
                  <th className="px-6 py-4.5 w-4/12 min-w-[180px]">Student Details</th>
                  <th className="px-3 py-4.5 w-4/12 min-w-[280px] text-center">Attendance Selection (P / A / L)</th>
                  <th className="px-6 py-4.5 w-3/12 min-w-[185px]">Remarks / Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150">
                {classStudents.map((student) => {
                  const studentRecord = records[student.id] || { status: 'Present', note: '' };
                  const activeStatus = studentRecord.status;

                  return (
                    <tr key={student.id} className="hover:bg-slate-55/30 transition-colors">
                      {/* Roll No Column */}
                      <td className="px-6 py-4.5 font-mono font-bold text-slate-800 text-sm">
                        {student.rollNo}
                      </td>

                      {/* Student Details */}
                      <td className="px-6 py-4.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs uppercase shadow-3xs select-none">
                            {student.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                          </div>
                          <div>
                            <h4 className="font-extrabold text-slate-800 text-xs sm:text-sm font-sans leading-tight">
                              {student.name}
                            </h4>
                            <span className="text-[9px] text-slate-400 uppercase tracking-wider block mt-0.5 font-mono">
                              ID: {student.id}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* One Click Status Grid */}
                      <td className="px-3 py-4.5 text-center">
                        <div className="inline-flex gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200 select-none shadow-3xs">
                          
                          {/* Present Column Key */}
                          <button
                            type="button"
                            onClick={() => handleStatusChange(student.id, 'Present')}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              activeStatus === 'Present'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'text-slate-650 hover:bg-slate-200'
                            }`}
                          >
                            <span className="w-2 h-2 rounded-full bg-current"></span>
                            <span>P</span>
                          </button>

                          {/* Absent Column Key */}
                          <button
                            type="button"
                            onClick={() => handleStatusChange(student.id, 'Absent')}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              activeStatus === 'Absent'
                                ? 'bg-red-600 text-white shadow-xs'
                                : 'text-slate-650 hover:bg-slate-200'
                            }`}
                          >
                            <span className="w-2 h-2 rounded-full bg-current"></span>
                            <span>A</span>
                          </button>

                          {/* Late Column Key */}
                          <button
                            type="button"
                            onClick={() => handleStatusChange(student.id, 'Late')}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              activeStatus === 'Late'
                                ? 'bg-amber-500 text-white shadow-xs'
                                : 'text-slate-650 hover:bg-slate-200'
                            }`}
                          >
                            <span className="w-2 h-2 rounded-full bg-current"></span>
                            <span>L</span>
                          </button>

                          {/* Excused Column Key */}
                          <button
                            type="button"
                            onClick={() => handleStatusChange(student.id, 'Excused')}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              activeStatus === 'Excused'
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'text-slate-650 hover:bg-slate-200'
                            }`}
                          >
                            <span className="w-2 h-2 rounded-full bg-current"></span>
                            <span>E</span>
                          </button>

                        </div>
                      </td>

                      {/* Remarks Note Input */}
                      <td className="px-6 py-4.5">
                        <input
                          type="text"
                          value={studentRecord.note}
                          onChange={(e) => handleNoteChange(student.id, e.target.value)}
                          placeholder="medical, delayed..."
                          className="w-full border border-slate-250 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg px-3 py-2 text-xs outline-none bg-slate-50/50 focus:bg-white font-sans transition-all"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer actions */}
        {totalStudents > 0 && (
          <div className="p-6 bg-slate-50 flex items-center justify-between gap-4 border-t border-slate-200">
            <p className="text-xs text-slate-400 font-sans font-light hidden sm:block">
              Verify marked statuses with roster sequence before clicking Save.
            </p>
            <div className="flex items-center gap-3 w-full sm:w-auto ml-auto">
              <button
                type="button"
                onClick={onCancel}
                className="w-full sm:w-auto bg-white border border-slate-200 text-slate-705 hover:text-slate-900 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold hover:bg-slate-100 transition-colors cursor-pointer select-none"
              >
                Cancel
              </button>
              
              <button
                type="submit"
                id="save-attendance-btn"
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm cursor-pointer flex items-center justify-center gap-1.5 select-none"
              >
                <Save className="w-4 h-4 text-white" />
                <span>Save Attendance</span>
              </button>
            </div>
          </div>
        )}
      </form>

    </div>
  );
}
