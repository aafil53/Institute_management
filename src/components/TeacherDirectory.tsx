import React, { useState, useMemo } from 'react';
import { Teacher, TimetableEntry, ClassGroup } from '../types';
import { Search, Plus, Edit, Trash2, Mail, Phone, Calendar, Briefcase, PlusCircle, X, Users, Save, HelpCircle } from 'lucide-react';

interface TeacherDirectoryProps {
  teachers: Teacher[];
  timetable: TimetableEntry[];
  classes: ClassGroup[];
  onAddTeacher: (teacher: Omit<Teacher, 'id'>) => void;
  onEditTeacher: (teacher: Teacher) => void;
  onDeleteTeacher: (teacherId: string) => void;
}

export default function TeacherDirectory({
  teachers,
  timetable,
  classes,
  onAddTeacher,
  onEditTeacher,
  onDeleteTeacher
}: TeacherDirectoryProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Modal active states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);

  // Form values
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formEmpId, setFormEmpId] = useState('');
  const [formDept, setFormDept] = useState('');
  const [formContact, setFormContact] = useState('');

  const openAddModal = () => {
    setFormName('');
    setFormEmail('');
    setFormEmpId(`EMP-${Math.floor(1000 + Math.random() * 9000)}`);
    setFormDept('Science');
    setFormContact('');
    setIsAddOpen(true);
  };

  const openEditModal = (t: Teacher) => {
    setSelectedTeacher(t);
    setFormName(t.name);
    setFormEmail(t.email);
    setFormEmpId(t.employeeId);
    setFormDept(t.department);
    setFormContact(t.contact || '');
    setIsEditOpen(true);
  };

  const handleAddNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim() || !formEmpId.trim() || !formDept.trim()) {
      alert('Please fill out all required fields!');
      return;
    }
    onAddTeacher({
      name: formName,
      employeeId: formEmpId,
      email: formEmail,
      department: formDept,
      contact: formContact
    });
    setIsAddOpen(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacher) return;
    if (!formName.trim() || !formEmail.trim() || !formEmpId.trim() || !formDept.trim()) {
      alert('Please fill out all required fields!');
      return;
    }
    onEditTeacher({
      id: selectedTeacher.id,
      name: formName,
      employeeId: formEmpId,
      email: formEmail,
      department: formDept,
      contact: formContact
    });
    setIsEditOpen(false);
    setSelectedTeacher(null);
  };

  // Delete trigger
  const handleDeleteTrigger = (id: string, name: string) => {
    if (confirm(`Are you sure you want to remove Teacher ${name}? This will free up all their scheduled timetable sessions.`)) {
      onDeleteTeacher(id);
    }
  };

  // Filter lists
  const filteredTeachers = useMemo(() => {
    return teachers.filter(t => {
      return (
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [teachers, searchTerm]);

  // Helper: compute assigned courses / timetable entries count for each teacher
  const getSimulatedTeacherLoad = (teacherId: string) => {
    const list = timetable.filter(e => e.teacherId === teacherId);
    return {
      count: list.length,
      list
    };
  };

  const DEPARTMENTS = ['Science', 'Technology', 'Commerce', 'Humanities', 'Languages'];

  return (
    <div id="teacher-directory" className="space-y-6">
      {/* Search and Filters toolbar */}
      <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            id="teacher-search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search team by name, employee ID, department..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-sm outline-none font-sans font-medium transition-all"
          />
        </div>

        <button
          onClick={openAddModal}
          id="btn-add-teacher"
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2.5 px-4 rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5 transition-colors select-none"
        >
          <Plus className="w-4 h-4" />
          Hire Faculty
        </button>
      </div>

      {/* Grid container for standard cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTeachers.length === 0 ? (
          <div className="md:col-span-3 text-center py-12 text-slate-400 text-sm font-sans">
            No matching teacher profiles found. Hire key faculties to start scheduling programs.
          </div>
        ) : (
          filteredTeachers.map((teacher) => {
            const load = getSimulatedTeacherLoad(teacher.id);

            return (
              <div key={teacher.id} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                <div className="space-y-4">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-50 text-slate-700 border border-slate-150 flex items-center justify-center font-bold text-sm uppercase">
                        {teacher.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm sm:text-base font-sans">{teacher.name}</h4>
                        <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded uppercase font-semibold">
                          {teacher.employeeId}
                        </span>
                      </div>
                    </div>

                    <span className="text-[10px] bg-indigo-55/10 text-indigo-700 font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                      {teacher.department}
                    </span>
                  </div>

                  {/* Contact channels */}
                  <div className="space-y-1.5 pt-1 text-xs text-slate-500 font-sans border-t border-slate-50">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{teacher.email}</span>
                    </div>
                    {teacher.contact && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{teacher.contact}</span>
                      </div>
                    )}
                  </div>

                  {/* Program Teaching Load Info */}
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs">
                    <div className="flex justify-between items-center text-slate-500 font-sans mb-1 font-semibold">
                      <span>Weekly Schedule Load</span>
                      <span className="text-indigo-600 font-bold">{load.count} Lectures</span>
                    </div>
                    {load.count > 0 ? (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {load.list.map((l, index) => {
                          const clsName = classes.find(c => c.id === l.classId)?.name || 'Class';
                          return (
                            <span key={index} className="bg-white border border-slate-200 text-[10px] font-medium text-slate-700 px-2 py-0.5 rounded-sm">
                              {l.courseName} ({clsName})
                            </span>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-[10px] text-slate-400 font-sans italic mt-1 bg-white p-1 rounded-sm border border-slate-150 text-center">
                        No scheduled hours associated.
                      </p>
                    )}
                  </div>
                </div>

                {/* Bottom Card Actions */}
                <div className="flex items-center justify-end gap-2.5 pt-4 mt-4 border-t border-slate-100">
                  <button
                    onClick={() => openEditModal(teacher)}
                    className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer select-none"
                  >
                    <Edit className="w-3.5 h-3.5 text-slate-400" />
                    Modify
                  </button>
                  <button
                    onClick={() => handleDeleteTrigger(teacher.id, teacher.name)}
                    className="flex items-center gap-1.5 bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 hover:border-rose-150 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer select-none"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-slate-400" />
                    Dismiss
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL 1: ADD TEACHER */}
      {isAddOpen && (
        <div id="add-teacher-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div id="add-teacher-modal" className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden border border-slate-150 transform transition-all">
            <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-800 text-sm sm:text-base font-sans">Hire Faculty Staff</h3>
              <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddNew} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 font-sans">Teacher Full Name *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Margaret Hamilton"
                  className="w-full border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3.5 py-2 text-sm outline-none font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 font-sans">Employee ID *</label>
                  <input
                    type="text"
                    required
                    value={formEmpId}
                    onChange={(e) => setFormEmpId(e.target.value)}
                    className="w-full border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3.5 py-2 text-sm outline-none font-mono text-slate-600 bg-slate-50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 font-sans">Department *</label>
                  <select
                    required
                    value={formDept}
                    onChange={(e) => setFormDept(e.target.value)}
                    className="w-full border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3.5 py-2 text-sm outline-none font-sans bg-transparent"
                  >
                    {DEPARTMENTS.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
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
                  placeholder="e.g. m.hamilton@institute.edu"
                  className="w-full border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3.5 py-2 text-sm outline-none font-sans"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 font-sans">Phone Number Contact</label>
                <input
                  type="text"
                  value={formContact}
                  onChange={(e) => setFormContact(e.target.value)}
                  placeholder="e.g. +1 (555) 345-0909"
                  className="w-full border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3.5 py-2 text-sm outline-none font-sans"
                />
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
                  Create Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT TEACHER */}
      {isEditOpen && selectedTeacher && (
        <div id="edit-teacher-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div id="edit-teacher-modal" className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden border border-slate-150 transform transition-all">
            <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-800 text-sm sm:text-base font-sans">Modify Faculty Profile Info</h3>
              <button onClick={() => { setIsEditOpen(false); setSelectedTeacher(null); }} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
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
                  <label className="text-xs font-semibold text-slate-600 font-sans">Employee ID *</label>
                  <input
                    type="text"
                    required
                    readOnly
                    value={formEmpId}
                    onChange={(e) => setFormEmpId(e.target.value)}
                    className="w-full border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3.5 py-2 text-sm outline-none font-mono text-slate-500 bg-slate-50 cursor-not-allowed"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 font-sans">Department *</label>
                  <select
                    required
                    value={formDept}
                    onChange={(e) => setFormDept(e.target.value)}
                    className="w-full border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3.5 py-2 text-sm outline-none font-sans bg-transparent"
                  >
                    {DEPARTMENTS.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
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
                  className="w-full border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3.5 py-2 text-sm outline-none font-sans"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 font-sans">Phone Contact</label>
                <input
                  type="text"
                  value={formContact}
                  onChange={(e) => setFormContact(e.target.value)}
                  className="w-full border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3.5 py-2 text-sm outline-none font-sans"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => { setIsEditOpen(false); setSelectedTeacher(null); }}
                  className="bg-white border border-slate-200 text-slate-700 hover:text-slate-905 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
