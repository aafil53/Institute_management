import React from 'react';
import { Teacher } from '../types';
import { Shield, Sparkles, UserCheck } from 'lucide-react';

interface RoleSwitcherProps {
  currentRole: 'teacher' | 'admin';
  onChangeRole: (role: 'teacher' | 'admin') => void;
  teachers: Teacher[];
  currentTeacherId: string;
  onChangeTeacher: (teacherId: string) => void;
}

export default function RoleSwitcher({
  currentRole,
  onChangeRole,
  teachers,
  currentTeacherId,
  onChangeTeacher
}: RoleSwitcherProps) {
  const activeTeacherObj = teachers.find(t => t.id === currentTeacherId) || teachers[0];

  return (
    <div id="role-switcher-container" className="bg-[#0f172a] text-white px-6 py-2.5 shrink-0 flex flex-col md:flex-row md:items-center md:justify-between gap-3 shadow-sm">
      <div className="flex items-center gap-2">
        <div className="bg-blue-600 text-white p-1 rounded-md">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div>
          <span className="text-xs font-semibold tracking-tight font-sans text-slate-100">Sandbox Control Console</span>
          <span className="hidden md:inline text-[11px] text-slate-400 font-sans ml-2 border-l border-slate-700 pl-2">Toggle perspectives instantly</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* Role Selector Button Group */}
        <div id="role-button-group" className="inline-flex rounded-md p-0.5 bg-slate-800 border border-slate-750">
          <button
            id="role-btn-teacher"
            onClick={() => onChangeRole('teacher')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded transition-all cursor-pointer ${
              currentRole === 'teacher'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            Teacher Mode
          </button>
          <button
            id="role-btn-admin"
            onClick={() => onChangeRole('admin')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded transition-all cursor-pointer ${
              currentRole === 'admin'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            Admin Mode
          </button>
        </div>

        {/* Teacher Selection dropdown (visible if role is teacher) */}
        {currentRole === 'teacher' && (
          <div id="teacher-dropdown-wrapper" className="flex items-center gap-2 bg-slate-800 border border-slate-700 px-3 py-1 rounded-md">
            <span className="text-[11px] font-medium text-slate-400 font-sans">Active User:</span>
            <select
              id="teacher-select"
              value={currentTeacherId}
              onChange={(e) => onChangeTeacher(e.target.value)}
              className="text-[11px] font-semibold text-white bg-transparent border-none outline-none cursor-pointer focus:ring-0 mr-1 font-sans"
            >
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id} className="text-slate-900 bg-white">
                  {teacher.name} ({teacher.department})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}
