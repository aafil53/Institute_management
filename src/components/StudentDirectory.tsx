import React, { useState, useMemo } from 'react';
import { Student, ClassGroup, AttendanceLog } from '../types';
import { Search, Plus, Filter, Edit, Trash2, Eye, UserPlus, X, Save, GraduationCap, Calendar, Check, AlertCircle } from 'lucide-react';

interface StudentDirectoryProps {
  students: Student[];
  classes: ClassGroup[];
  attendanceLogs: AttendanceLog[];
  onAddStudent: (student: Omit<Student, 'id'>) => void;
  onEditStudent: (student: Student) => void;
  onDeleteStudent: (studentId: string) => void;
}

export default function StudentDirectory({
  students,
  classes,
  attendanceLogs,
  onAddStudent,
  onEditStudent,
  onDeleteStudent
}: StudentDirectoryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('all');

  // Modal control states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);

  // Focus Student States
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Form input states
  const [formName, setFormName] = useState('');
  const [formRoll, setFormRoll] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formClassId, setFormClassId] = useState('');
  const [formActive, setFormActive] = useState(true);

  // Synchronize edit forms
  const openEditModal = (stud: Student) => {
    setSelectedStudent(stud);
    setFormName(stud.name);
    setFormRoll(stud.rollNo);
    setFormEmail(stud.email);
    setFormClassId(stud.classId);
    setFormActive(stud.isActive);
    setIsEditOpen(true);
  };

  const openAddModal = () => {
    setFormName('');
    setFormRoll('');
    setFormEmail('');
    setFormClassId(classes[0]?.id || '');
    setFormActive(true);
    setIsAddOpen(true);
  };

  const openViewProfile = (stud: Student) => {
    setSelectedStudent(stud);
    setIsViewOpen(true);
  };

  // Submit adding
  const handleAddNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formRoll.trim() || !formEmail.trim() || !formClassId) {
      alert('Please fill all mandatory fields!');
      return;
    }
    // simple email validation
    if (!formEmail.includes('@')) {
      alert('Must be a valid email!');
      return;
    }
    
    onAddStudent({
      name: formName,
      rollNo: formRoll,
      classId: formClassId,
      email: formEmail,
      isActive: formActive
    });
    
    setIsAddOpen(false);
  };

  // Submit edit
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    if (!formName.trim() || !formRoll.trim() || !formEmail.trim() || !formClassId) {
      alert('Please fill all mandatory fields!');
      return;
    }

    onEditStudent({
      id: selectedStudent.id,
      name: formName,
      rollNo: formRoll,
      classId: formClassId,
      email: formEmail,
      isActive: formActive
    });

    setIsEditOpen(false);
    setSelectedStudent(null);
  };

  // Delete student confirmation
  const handleDeleteTrigger = (id: string, name: string) => {
    if (confirm(`Are you absolutely sure you want to dismiss Student ${name}? This action cannot be undone.`)) {
      onDeleteStudent(id);
    }
  };

  // Filter students
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const matchSearch = 
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.rollNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchClass = classFilter === 'all' || student.classId === classFilter;

      return matchSearch && matchClass;
    });
  }, [students, searchTerm, classFilter]);

  // Aggregate attendance index for selected viewing profile
  const selectedStudentAttendanceSummary = useMemo(() => {
    if (!selectedStudent) return null;
    let total = 0;
    let present = 0;
    let absent = 0;
    let late = 0;
    let excused = 0;
    
    const logs: Array<{ date: string; courseName: string; status: string; note?: string }> = [];

    // loop and aggregate
    attendanceLogs.forEach(entry => {
      const match = entry.records.find(r => r.studentId === selectedStudent.id);
      if (match) {
        total++;
        if (match.status === 'Present') present++;
        else if (match.status === 'Absent') absent++;
        else if (match.status === 'Late') late++;
        else if (match.status === 'Excused') excused++;

        logs.push({
          date: entry.date,
          courseName: entry.courseName,
          status: match.status,
          note: match.note
        });
      }
    });

    const percent = total > 0 ? Math.round(((present + late + excused * 0.5) / total) * 100) : 100;
    return {
      total,
      present,
      absent,
      late,
      excused,
      percent,
      logs: logs.sort((a,b) => b.date.localeCompare(a.date))
    };
  }, [selectedStudent, attendanceLogs]);

  return (
    <div id="student-directory" className="space-y-6">
      {/* Search and Filters toolbar */}
      <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              id="student-search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search student by name, roll no, or email..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-sm outline-none font-sans font-medium transition-all"
            />
          </div>

          <div className="flex items-center gap-3">
            {/* Class filter dropdown */}
            <div id="class-filter-dropdown" className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 shrink-0">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="text-xs font-semibold text-slate-700 bg-transparent outline-none cursor-pointer border-none focus:ring-0 mr-1"
              >
                <option value="all">All Classes</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick launcher click */}
            <button
              onClick={openAddModal}
              id="btn-add-student"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2.5 px-4 rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5 transition-colors select-none"
            >
              <UserPlus className="w-4 h-4" />
              Enroll Student
            </button>
          </div>
        </div>
      </div>

      {/* Directory Table Grid */}
      <div className="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table id="student-directory-table" className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 font-sans">
                <th className="px-6 py-4">Student Name / Roll</th>
                <th className="px-6 py-4">Class Section</th>
                <th className="px-6 py-4">Email Contact</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-sm font-sans">
                    No matching student records found. Add students or modify your query.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((stud) => {
                  const studentClass = classes.find(c => c.id === stud.classId)?.name || 'Class';
                  
                  return (
                    <tr key={stud.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs uppercase shadow-2xs border border-slate-200">
                            {stud.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-800 text-xs sm:text-sm font-sans">{stud.name}</h4>
                            <p className="text-[11px] text-slate-450 font-mono">Roll: {stud.rollNo}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-md">
                          {studentClass}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-xs font-medium text-slate-600 font-sans">
                        {stud.email}
                      </td>

                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                          stud.isActive 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          {stud.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="inline-flex gap-2">
                          <button
                            onClick={() => openViewProfile(stud)}
                            title="View student ledger profile"
                            className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-slate-200"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(stud)}
                            title="Edit student profile details"
                            className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-amber-600 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-slate-200"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTrigger(stud.id, stud.name)}
                            title="Remove student row record"
                            className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-red-500 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-slate-200"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: ADD STUDENT */}
      {isAddOpen && (
        <div id="add-student-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div id="add-student-modal" className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden border border-slate-150 transform transition-all">
            <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-800 text-sm sm:text-base font-sans">Enroll New Student</h3>
              <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddNew} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 font-sans">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Rachel Green"
                  className="w-full border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3.5 py-2 text-sm outline-none font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 font-sans">Roll Number *</label>
                  <input
                    type="text"
                    required
                    value={formRoll}
                    onChange={(e) => setFormRoll(e.target.value)}
                    placeholder="e.g. 10S-07"
                    className="w-full border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3.5 py-2 text-sm outline-none font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 font-sans">Class Selection *</label>
                  <select
                    required
                    value={formClassId}
                    onChange={(e) => setFormClassId(e.target.value)}
                    className="w-full border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3.5 py-2 text-sm outline-none font-sans bg-transparent"
                  >
                    {classes.map(cls => (
                      <option key={cls.id} value={cls.id}>{cls.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 font-sans">Email Address *</label>
                <input
                  type="email"
                  required
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="e.g. rachel@institute.edu"
                  className="w-full border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3.5 py-2 text-sm outline-none font-sans"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="add-student-active-toggle"
                  checked={formActive}
                  onChange={(e) => setFormActive(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                />
                <label htmlFor="add-student-active-toggle" className="text-xs font-semibold text-slate-700 font-sans cursor-pointer">
                  Mark profile as active in central register
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="bg-white border border-slate-200 text-slate-700 hover:text-slate-905 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors"
                >
                  Save student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT STUDENT */}
      {isEditOpen && selectedStudent && (
        <div id="edit-student-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div id="edit-student-modal" className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden border border-slate-150 transform transition-all">
            <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-800 text-sm sm:text-base font-sans">Modify Student Ledger Profile</h3>
              <button onClick={() => { setIsEditOpen(false); setSelectedStudent(null); }} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 font-sans">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3.5 py-2 text-sm outline-none font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 font-sans">Roll Number *</label>
                  <input
                    type="text"
                    required
                    value={formRoll}
                    onChange={(e) => setFormRoll(e.target.value)}
                    className="w-full border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3.5 py-2 text-sm outline-none font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 font-sans">Class Selection *</label>
                  <select
                    required
                    value={formClassId}
                    onChange={(e) => setFormClassId(e.target.value)}
                    className="w-full border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3.5 py-2 text-sm outline-none font-sans bg-transparent"
                  >
                    {classes.map(cls => (
                      <option key={cls.id} value={cls.id}>{cls.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 font-sans font-mono">Email Address *</label>
                <input
                  type="email"
                  required
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3.5 py-2 text-sm outline-none font-sans"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="edit-student-active-toggle"
                  checked={formActive}
                  onChange={(e) => setFormActive(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                />
                <label htmlFor="edit-student-active-toggle" className="text-xs font-semibold text-slate-700 font-sans cursor-pointer">
                  Mark profile as active in central register
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => { setIsEditOpen(false); setSelectedStudent(null); }}
                  className="bg-white border border-slate-200 text-slate-700 hover:text-slate-905 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors"
                >
                  Update student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: VIEW STUDENT DOSSIER/PROFILE */}
      {isViewOpen && selectedStudent && selectedStudentAttendanceSummary && (
        <div id="view-student-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div id="view-student-modal" className="bg-white rounded-2xl w-full max-w-xl shadow-xl overflow-hidden border border-slate-150 my-8 transform transition-all">
            <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <GraduationCap className="text-indigo-600 w-5 h-5" />
                <h3 className="font-bold text-slate-800 text-sm sm:text-base font-sans">Academic Dossier File</h3>
              </div>
              <button onClick={() => { setIsViewOpen(false); setSelectedStudent(null); }} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              {/* Profile Header Block */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 bg-slate-50 border border-slate-100 p-4 rounded-xl">
                <div className="w-14 h-14 rounded-full bg-indigo-100 text-indigo-700 border-2 border-indigo-200 flex items-center justify-center font-black text-lg uppercase shadow-2xs">
                  {selectedStudent.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-base sm:text-lg font-sans leading-snug">{selectedStudent.name}</h4>
                  <p className="text-xs text-slate-400 font-mono">Roll Number: {selectedStudent.rollNo}</p>
                  <p className="text-xs text-slate-500 font-sans mt-0.5">
                    Class: <span className="font-semibold text-slate-700">{classes.find(c => c.id === selectedStudent.classId)?.name || 'Class'}</span> • Email: {selectedStudent.email}
                  </p>
                </div>
              </div>

              {/* Attendance Statistics Scorecard Grid */}
              <div className="grid grid-cols-5 gap-2 text-center">
                <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-lg col-span-2 flex flex-col justify-center">
                  <div className={`text-xl sm:text-2xl font-extrabold font-mono ${
                    selectedStudentAttendanceSummary.percent >= 85 ? 'text-indigo-600' : 'text-amber-600'
                  }`}>
                    {selectedStudentAttendanceSummary.percent}%
                  </div>
                  <div className="text-[9px] text-slate-450 uppercase font-semibold tracking-wider font-sans mt-0.5">Overall Attendance</div>
                </div>

                <div className="bg-emerald-50 border border-emerald-100 p-2 rounded-lg">
                  <div className="text-sm sm:text-base font-bold text-emerald-700 font-mono">{selectedStudentAttendanceSummary.present}</div>
                  <div className="text-[9px] text-emerald-600 font-medium font-sans">Present</div>
                </div>

                <div className="bg-red-50 border border-red-100 p-2 rounded-lg">
                  <div className="text-sm sm:text-base font-bold text-red-650 font-mono">{selectedStudentAttendanceSummary.absent}</div>
                  <div className="text-[9px] text-red-650 font-medium font-sans">Absent</div>
                </div>

                <div className="bg-amber-50 border border-amber-150 p-2 rounded-lg">
                  <div className="text-sm sm:text-base font-bold text-amber-600 font-mono">{selectedStudentAttendanceSummary.late}</div>
                  <div className="text-[9px] text-amber-500 font-medium font-sans">Late</div>
                </div>
              </div>

              {/* Status breakdown warning */}
              {selectedStudentAttendanceSummary.percent < 82 && (
                <div className="bg-amber-50 border border-amber-100 p-3 rounded-lg flex items-start gap-2.5">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-xs font-bold text-amber-800 font-sans">Retention Warning Triggered</h5>
                    <p className="text-[11px] text-amber-700 font-sans mt-0.5 leading-snug">
                       This student's attendance ({selectedStudentAttendanceSummary.percent}%) falls below the institutional benchmark of 82%. Academic retention counseling is recommended.
                    </p>
                  </div>
                </div>
              )}

              {/* Historical Attendance Records List */}
              <div className="space-y-2">
                <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-sans flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  Direct Session Logs ({selectedStudentAttendanceSummary.logs.length})
                </h5>
                <div className="border border-slate-100 rounded-xl divide-y divide-slate-100 max-h-[180px] overflow-y-auto bg-slate-50/50">
                  {selectedStudentAttendanceSummary.logs.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 text-xs font-sans">
                      No historical audit logs matching this student row.
                    </div>
                  ) : (
                    selectedStudentAttendanceSummary.logs.map((log, index) => {
                      return (
                        <div key={index} className="px-4 py-2.5 flex items-center justify-between text-xs hover:bg-slate-50 transition-colors">
                          <div>
                            <span className="font-semibold text-slate-700 font-sans">{log.courseName}</span>
                            <span className="text-[10px] text-slate-450 font-mono block mt-0.5">{log.date}</span>
                            {log.note && (
                              <span className="text-[10px] bg-indigo-50/10 text-slate-500 block italic mt-0.5">
                                Note: "{log.note}"
                              </span>
                            )}
                          </div>
                          <span className={`px-2 py-0.5 rounded font-bold font-sans text-[10px] ${
                            log.status === 'Present' ? 'bg-emerald-55/10 text-emerald-800' :
                            log.status === 'Absent' ? 'bg-red-55/10 text-red-700' :
                            log.status === 'Late' ? 'bg-amber-55/10 text-amber-700' :
                            'bg-blue-55/10 text-blue-700'
                          }`}>
                            {log.status}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Bottom dossier action button */}
              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => { setIsViewOpen(false); setSelectedStudent(null); }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2 rounded-xl transition-colors cursor-pointer"
                >
                  Close Dossier File
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
