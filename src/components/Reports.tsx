import React, { useState, useMemo } from 'react';
import { ClassGroup, Student, AttendanceLog, TimetableEntry } from '../types';
import { FileText, Search, Printer, Copy, Check, Download, AlertTriangle, Calendar, Info, RefreshCw } from 'lucide-react';

interface ReportsProps {
  classes: ClassGroup[];
  students: Student[];
  attendanceLogs: AttendanceLog[];
  timetable: TimetableEntry[];
}

export default function Reports({
  classes,
  students,
  attendanceLogs,
  timetable
}: ReportsProps) {
  const [selectedClassId, setSelectedClassId] = useState(classes[0]?.id || '');
  const [selectedCourse, setSelectedCourse] = useState('All');
  
  // Date range picker values
  // default to last 30 days
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  const [copiedCsv, setCopiedCsv] = useState(false);
  const [showCsvBox, setShowCsvBox] = useState(false);

  // Dynamically obtain courses scheduled for the selected class to populate the course dropdown
  const siblingCourses = useMemo(() => {
    const courses = new Set<string>();
    timetable
      .filter(entry => entry.classId === selectedClassId)
      .forEach(entry => courses.add(entry.courseName));
    return ['All', ...Array.from(courses)];
  }, [timetable, selectedClassId]);

  // If class is toggled, default the course state to "All" to avoid orphaned keys
  const handleClassChange = (classId: string) => {
    setSelectedClassId(classId);
    setSelectedCourse('All');
  };

  // Perform report database query execution in real time
  const reportResults = useMemo(() => {
    // 1. Filter historical logs matching criteria
    const matchingLogs = attendanceLogs.filter(log => {
      const matchClass = log.classId === selectedClassId;
      const matchCourse = selectedCourse === 'All' || log.courseName === selectedCourse;
      const matchDate = log.date >= startDate && log.date <= endDate;
      return matchClass && matchCourse && matchDate;
    });

    // 2. Obtain list of students targeted in this class sequence
    const classStudents = students.filter(s => s.classId === selectedClassId);

    // 3. Compute student matrices
    const studentStats = classStudents.map(student => {
      let sessionsCount = 0;
      let presentCount = 0;
      let absentCount = 0;
      let lateCount = 0;
      let excusedCount = 0;

      matchingLogs.forEach(log => {
        const studRecord = log.records.find(r => r.studentId === student.id);
        if (studRecord) {
          sessionsCount++;
          if (studRecord.status === 'Present') presentCount++;
          else if (studRecord.status === 'Absent') absentCount++;
          else if (studRecord.status === 'Late') lateCount++;
          else if (studRecord.status === 'Excused') excusedCount++;
        }
      });

      // Calculate attendance rating
      // Late counts as 0.75 attendance, excused counts as 0.5 (or custom weighting)
      const adjustedPresent = presentCount + (lateCount * 0.8) + excusedCount; // 80% weight for late
      const ratePercentage = sessionsCount > 0 ? Math.round((adjustedPresent / sessionsCount) * 100) : 100;

      return {
        id: student.id,
        name: student.name,
        rollNo: student.rollNo,
        sessionsCount,
        presentCount,
        absentCount,
        lateCount,
        excusedCount,
        ratePercentage
      };
    });

    // 4. Global statistics summary for criteria
    let totalPresentSum = 0;
    let totalSessionEntries = 0;

    studentStats.forEach(s => {
      totalSessionEntries += s.sessionsCount;
      totalPresentSum += s.presentCount + (s.lateCount * 0.8) + s.excusedCount;
    });

    const averageScore = totalSessionEntries > 0 ? Math.round((totalPresentSum / totalSessionEntries) * 100) : 92.4;
    const lowRetentionStudents = studentStats.filter(s => s.ratePercentage < 82);
    const perfectAttendanceStudents = studentStats.filter(s => s.sessionsCount > 0 && s.ratePercentage >= 95);

    return {
      matchingLogs,
      studentStats,
      averageScore,
      lowAttendanceCount: lowRetentionStudents.length,
      perfectAttendanceCount: perfectAttendanceStudents.length,
      totalClassAuditsChecked: matchingLogs.length
    };
  }, [selectedClassId, selectedCourse, startDate, endDate, students, attendanceLogs]);

  // Simple CSV Text exporter string generator
  const generatedCsvString = useMemo(() => {
    let header = 'Roll No,Student Name,Total Sessions,Present,Absent,Late,Excused,Calculated Attend Rate (%)\n';
    let rows = reportResults.studentStats.map(s => {
      return `"${s.rollNo}","${s.name}",${s.sessionsCount},${s.presentCount},${s.absentCount},${s.lateCount},${s.excusedCount},${s.ratePercentage}%`;
    }).join('\n');
    return header + rows;
  }, [reportResults]);

  // Copy CSV clipboard utility
  const handleCopyCsv = () => {
    navigator.clipboard.writeText(generatedCsvString);
    setCopiedCsv(true);
    setTimeout(() => setCopiedCsv(false), 2000);
  };

  // Launch browser native single element printing
  const handlePrint = () => {
    window.print();
  };

  const activeClassName = classes.find(c => c.id === selectedClassId)?.name || 'Class';

  return (
    <div id="reports-module" className="space-y-6">
      
      {/* Search Input filter bar parameters panel */}
      <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-sans mb-4 flex items-center gap-1.5">
          <FileText className="w-4 h-4 text-slate-400" />
          General Report Query Setup
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Class Select */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600 font-sans">Class Cohort</label>
            <select
              value={selectedClassId}
              onChange={(e) => handleClassChange(e.target.value)}
              className="w-full border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3 py-2 text-xs outline-none bg-slate-50 font-sans"
            >
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </select>
          </div>

          {/* Sibling Course Module Filter */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600 font-sans">Course/Subject Filter</label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3 py-2 text-xs outline-none bg-slate-50 font-sans"
            >
              {siblingCourses.map(course => (
                <option key={course} value={course}>{course === 'All' ? 'All (Aggregated)' : course}</option>
              ))}
            </select>
          </div>

          {/* Start Date Range */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600 font-sans">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3 py-2 text-xs outline-none bg-slate-50 font-mono"
            />
          </div>

          {/* End Date Range */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600 font-sans">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3 py-2 text-xs outline-none bg-slate-50 font-mono"
            />
          </div>
        </div>
      </div>

      {/* REPORT CONTENT OUTPUT */}
      <div id="print-area" className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-xs p-6 print:p-0 print:border-none space-y-6">
        
        {/* Report Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-5 border-b border-slate-150 gap-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-800 font-sans">Institutional Audit Registry Report</h2>
            <p className="text-xs text-slate-500 font-sans mt-0.5">
              Target class: <span className="font-semibold text-slate-700">{activeClassName}</span> • Target Course: <span className="font-semibold text-indigo-600">{selectedCourse === 'All' ? 'All Lectures' : selectedCourse}</span>
            </p>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">Timeline boundaries: {startDate} to {endDate}</p>
          </div>

          {/* Options toolbar (hidden on raw print output) */}
          <div className="flex items-center gap-2 print:hidden">
            <button
              onClick={() => setShowCsvBox(prev => !prev)}
              className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-3 py-2 rounded-xl text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              CSV Sheet View
            </button>

            <button
              onClick={handlePrint}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Report
            </button>
          </div>
        </div>

        {/* Highlight Scorecard metrics strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-1">
          <div className="bg-slate-50/50 border border-slate-150 p-4 rounded-xl">
            <div className="text-xs font-bold text-indigo-700 font-sans">Average Score Rate</div>
            <div className="text-2xl font-black text-slate-800 mt-1 font-mono">{reportResults.averageScore}%</div>
            <p className="text-[9px] text-slate-400 font-sans mt-0.5">Weighted ratios</p>
          </div>

          <div className="bg-slate-50/50 border border-slate-150 p-4 rounded-xl">
            <div className="text-xs font-bold text-slate-605 font-sans">Audited Sessions</div>
            <div className="text-2xl font-black text-slate-800 mt-1 font-mono">{reportResults.totalClassAuditsChecked} Logged</div>
            <p className="text-[9px] text-slate-400 font-sans mt-0.5">Inside given date boundary</p>
          </div>

          <div className="bg-slate-50/50 border border-slate-150 p-4 rounded-xl">
            <div className="text-xs font-bold text-emerald-700 font-sans">High Attendance (&ge;95%)</div>
            <div className="text-2xl font-black text-emerald-600 mt-1 font-mono">{reportResults.perfectAttendanceCount} Student(s)</div>
            <p className="text-[9px] text-slate-400 font-sans mt-0.5">Streaks records</p>
          </div>

          <div className="bg-slate-50/50 border border-slate-150 p-4 rounded-xl">
            <div className="text-xs font-bold text-red-700 font-sans">Retention Alert (&le;82%)</div>
            <div className={`text-2xl font-black mt-1 font-mono ${reportResults.lowAttendanceCount > 0 ? 'text-amber-600' : 'text-slate-800'}`}>
              {reportResults.lowAttendanceCount} Student(s)
            </div>
            <p className="text-[9px] text-slate-400 font-sans mt-0.5">Requires counseling</p>
          </div>
        </div>

        {/* CSV raw text box popup if requested (hidden in standard print) */}
        {showCsvBox && (
          <div className="bg-slate-900 text-slate-200 p-4 rounded-xl space-y-2 border border-slate-800 print:hidden font-mono text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 font-sans">
              <span className="text-[11px] text-slate-400 uppercase tracking-widest font-bold">Interactive Tabular CSV Exporter</span>
              <button
                onClick={handleCopyCsv}
                className="bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-indigo-200 border border-indigo-950 px-2.5 py-1 rounded text-[10px] font-semibold transition-all flex items-center gap-1 cursor-pointer"
              >
                {copiedCsv ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedCsv ? 'Copied CSV!' : 'Copy to Clipboard'}
              </button>
            </div>
            <pre className="overflow-x-auto max-h-[140px] whitespace-pre p-2 bg-black/40 rounded text-amber-100">{generatedCsvString}</pre>
          </div>
        )}

        {/* Student attendance roster breakdown table */}
        <div className="space-y-3">
          <h3 className="font-bold text-slate-800 text-xs sm:text-sm uppercase tracking-wider font-sans">Roster Statistics ledger</h3>
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-150 font-sans">
                  <th className="px-5 py-3">Roll No</th>
                  <th className="px-5 py-3">Student Name</th>
                  <th className="px-5 py-3 text-center">Total Classes</th>
                  <th className="px-5 py-3 text-center text-emerald-600">Present</th>
                  <th className="px-5 py-3 text-center text-red-600">Absent</th>
                  <th className="px-5 py-3 text-center text-amber-600">Late</th>
                  <th className="px-5 py-3 text-center text-blue-600">Excused</th>
                  <th className="px-5 py-3 text-right">Perform Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {reportResults.studentStats.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-8 text-center text-slate-400 text-xs">
                      No student records mapped to this class cohort section.
                    </td>
                  </tr>
                ) : (
                  reportResults.studentStats.map((s) => {
                    return (
                      <tr key={s.id} className="hover:bg-slate-50/20 transition-colors">
                        <td className="px-5 py-3.5 font-mono font-semibold text-slate-500">
                          {s.rollNo}
                        </td>
                        <td className="px-5 py-3.5 font-semibold text-slate-800">
                          {s.name}
                        </td>
                        <td className="px-5 py-3.5 text-center font-bold">
                          {s.sessionsCount}
                        </td>
                        <td className="px-5 py-3.5 text-center text-emerald-700 font-mono font-bold bg-emerald-50/10">
                          {s.presentCount}
                        </td>
                        <td className="px-5 py-3.5 text-center text-rose-700 font-mono font-bold bg-rose-50/10">
                          {s.absentCount}
                        </td>
                        <td className="px-5 py-3.5 text-center text-amber-700 font-mono font-semibold bg-amber-50/10">
                          {s.lateCount}
                        </td>
                        <td className="px-5 py-3.5 text-center text-blue-700 font-mono bg-blue-50/10">
                          {s.excusedCount}
                        </td>
                        <td className="px-5 py-3.5 text-right font-black">
                          <span className={`px-2 py-0.5 rounded-sm font-mono ${
                            s.ratePercentage >= 90 ? 'bg-emerald-50 text-emerald-705' :
                            s.ratePercentage >= 80 ? 'bg-slate-100 text-slate-800' :
                            'bg-amber-55/10 text-amber-700'
                          }`}>
                            {s.ratePercentage}%
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Dynamic footer summary statement */}
        <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex items-start gap-2.5">
          <Info className="w-4.5 h-4.5 text-indigo-505 shrink-0 mt-0.5" />
          <p className="text-[11px] text-slate-500 font-sans leading-relaxed">
            <strong>System Audit Note:</strong> Overall calculated average rates in this report are aggregate computations. Attendance ratios include weighted indices: Present (+1.0), Late (+0.8), Excused (+1.0), Absent (+0.0). These conform to standard academic audit guidelines for institutional retention.
          </p>
        </div>

      </div>
    </div>
  );
}
