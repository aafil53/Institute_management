import React, { useState, useMemo } from 'react';
import { ClassGroup, TimetableEntry, Teacher } from '../types';
import { 
  Calendar, 
  PlusCircle, 
  Trash2, 
  Edit, 
  Clock, 
  MapPin, 
  User, 
  BookOpen, 
  Layers, 
  X, 
  Save, 
  AlertTriangle, 
  Coffee, 
  Info, 
  Check, 
  Sparkles,
  Search,
  BadgeAlert,
  ArrowRight
} from 'lucide-react';

interface ClassTimetableSetupProps {
  classes: ClassGroup[];
  timetable: TimetableEntry[];
  teachers: Teacher[];
  onAddClass: (newClass: Omit<ClassGroup, 'id'>) => void;
  onDeleteClass: (classId: string) => void;
  onAddTimetableEntry: (entry: Omit<TimetableEntry, 'id'>) => void;
  onDeleteTimetableEntry: (entryId: string) => void;
  onUpdateTimetableEntry: (entry: TimetableEntry) => void;
}

export default function ClassTimetableSetup({
  classes,
  timetable,
  teachers,
  onAddClass,
  onDeleteClass,
  onAddTimetableEntry,
  onDeleteTimetableEntry,
  onUpdateTimetableEntry
}: ClassTimetableSetupProps) {
  // Main admin tabs
  const [activeTab, setActiveTab] = useState<'class-scheduler' | 'classes-list'>('class-scheduler');

  // Selected Class configuration context (defaults to the first class index)
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');

  // Keep selectedClassId updated if classes changes or was previously empty
  React.useEffect(() => {
    if (classes.length > 0 && (!selectedClassId || !classes.find(c => c.id === selectedClassId))) {
      setSelectedClassId(classes[0].id);
    }
  }, [classes, selectedClassId]);

  // Weekday selection filter within class context
  const [selectedDayFilter, setSelectedDayFilter] = useState<'All' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday'>('All');

  // Form modals state
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimetableEntry | null>(null);

  // Search filter query string
  const [searchQuery, setSearchQuery] = useState('');

  // Class creation fields
  const [classFormName, setClassFormName] = useState('');
  const [classFormDept, setClassFormDept] = useState('Science');

  // Timetable creation/edit fields
  const [schedClassId, setSchedClassId] = useState('');
  const [schedCourse, setSchedCourse] = useState('');
  const [schedTeacherId, setSchedTeacherId] = useState('');
  const [schedDay, setSchedDay] = useState<'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday'>('Monday');
  const [schedStart, setSchedStart] = useState('09:00');
  const [schedEnd, setSchedEnd] = useState('10:00');
  const [schedRoom, setSchedRoom] = useState('Room 101');
  const [schedStatus, setSchedStatus] = useState<'Active' | 'Rescheduled' | 'Cancelled' | 'Substitute' | 'Holiday'>('Active');

  const DEPT_TYPES = ['Science', 'Technology', 'Commerce', 'Humanities', 'Languages'];
  const DAYS_LIST = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  // Current selected class group object
  const activeClassGroup = useMemo(() => {
    return classes.find(c => c.id === selectedClassId) || classes[0] || null;
  }, [classes, selectedClassId]);

  // Extract timetable entries specifically belonging to this selected class
  const classTimetableEntries = useMemo(() => {
    if (!selectedClassId) return [];
    return timetable.filter(entry => entry.classId === selectedClassId);
  }, [timetable, selectedClassId]);

  // Filter entry checklist list by weekday and search criteria
  const filteredAndSortedEntries = useMemo(() => {
    return classTimetableEntries
      .filter(entry => {
        // Weekday Day match check
        if (selectedDayFilter !== 'All' && entry.dayOfWeek !== selectedDayFilter) return false;
        
        // Query match check (subjects, teacher names, venues)
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          const teacherName = teachers.find(t => t.id === entry.teacherId)?.name.toLowerCase() || '';
          return (
            entry.courseName.toLowerCase().includes(query) ||
            teacherName.includes(query) ||
            entry.room.toLowerCase().includes(query)
          );
        }
        return true;
      })
      .sort((a, b) => {
        const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        const dayDiff = dayOrder.indexOf(a.dayOfWeek) - dayOrder.indexOf(b.dayOfWeek);
        if (dayDiff !== 0) return dayDiff;
        return a.startTime.localeCompare(b.startTime);
      });
  }, [classTimetableEntries, selectedDayFilter, searchQuery, teachers]);

  // Bulk Holiday toggle triggers for active Day inside this class context
  const handleToggleDayHolidayForClass = (day: string) => {
    const dayEntries = classTimetableEntries.filter(e => e.dayOfWeek === day);
    if (dayEntries.length === 0) {
      alert(`No lectures scheduled on ${day} to toggle holidays for this class! Declare a schedule slot first.`);
      return;
    }

    const allHolidays = dayEntries.every(e => e.status === 'Holiday');
    const actionText = allHolidays ? 'Remove Holiday / Re-activate list of lectures' : 'Declare a formal School Holiday';
    
    if (confirm(`${actionText} for ${activeClassGroup?.name} on ${day}? This marks all assigned slots on this specific day as ${allHolidays ? 'Active' : 'Holiday'}.`)) {
      dayEntries.forEach(entry => {
        onUpdateTimetableEntry({
          ...entry,
          status: allHolidays ? 'Active' : 'Holiday'
        });
      });
    }
  };

  // Launch Create Schedule Dialog prefilled
  const handleOpenCreateModal = () => {
    setEditingEntry(null);
    setSchedClassId(selectedClassId || classes[0]?.id || '');
    setSchedCourse('');
    setSchedTeacherId(teachers[0]?.id || '');
    setSchedDay(selectedDayFilter !== 'All' ? selectedDayFilter : 'Monday');
    setSchedStart('09:00');
    setSchedEnd('10:00');
    setSchedRoom('Room 101');
    setSchedStatus('Active');
    setIsScheduleModalOpen(true);
  };

  // Launch Edit Schedule Dialog loaded with values
  const handleOpenEditModal = (entry: TimetableEntry) => {
    setEditingEntry(entry);
    setSchedClassId(entry.classId);
    setSchedCourse(entry.courseName);
    setSchedTeacherId(entry.teacherId);
    setSchedDay(entry.dayOfWeek as any);
    setSchedStart(entry.startTime);
    setSchedEnd(entry.endTime);
    setSchedRoom(entry.room);
    setSchedStatus(entry.status || 'Active');
    setIsScheduleModalOpen(true);
  };

  // Submission handler
  const handleSaveSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedClassId || !schedCourse.trim() || !schedTeacherId || !schedStart || !schedEnd || !schedRoom.trim()) {
      alert('Kindly fill out all scheduling inputs.');
      return;
    }

    const payload = {
      classId: schedClassId,
      courseName: schedCourse.trim(),
      teacherId: schedTeacherId,
      dayOfWeek: schedDay,
      startTime: schedStart,
      endTime: schedEnd,
      room: schedRoom.trim(),
      status: schedStatus
    };

    if (editingEntry) {
      onUpdateTimetableEntry({
        id: editingEntry.id,
        ...payload
      });
    } else {
      onAddTimetableEntry(payload);
    }

    setIsScheduleModalOpen(false);
    setEditingEntry(null);
  };

  // Handle class section creation
  const handleCreateClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!classFormName.trim() || !classFormDept) {
      alert('A valid class cohort name is required!');
      return;
    }
    onAddClass({
      name: classFormName.trim(),
      department: classFormDept
    });
    setClassFormName('');
    setIsClassModalOpen(false);
  };

  // Toggle single slot as Holiday
  const handleToggleSingleHoliday = (entry: TimetableEntry) => {
    const nextStatus = entry.status === 'Holiday' ? 'Active' : 'Holiday';
    onUpdateTimetableEntry({
      ...entry,
      status: nextStatus
    });
  };

  return (
    <div id="school-timetable-hub" className="space-y-6">
      
      {/* Top Category Tabs Navbar */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('class-scheduler')}
          className={`px-5 py-3.5 cursor-pointer text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'class-scheduler'
              ? 'border-blue-600 text-blue-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calendar className="w-4.5 h-4.5 text-current" />
          <span>Class-Wise Timetables</span>
        </button>
        <button
          onClick={() => setActiveTab('classes-list')}
          className={`px-5 py-3.5 cursor-pointer text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'classes-list'
              ? 'border-blue-600 text-blue-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4.5 h-4.5 text-current" />
          <span>Institutional Class Groups ({classes.length})</span>
        </button>
      </div>

      {/* VIEW SECTION A: CLASS-WISE SCHEDULING PORTAL */}
      {activeTab === 'class-scheduler' && (
        <div className="space-y-6">
          
          {/* Section Selector Grid for Classes */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-3xs">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest font-mono block mb-2.5">
              1. Select Class Section to manage
            </span>
            
            {classes.length === 0 ? (
              <div className="text-center py-6 text-slate-450 border border-dashed border-slate-200 rounded-lg text-xs space-y-2">
                <p>No class groups registered yet. Go register class sections first.</p>
                <button
                  onClick={() => setActiveTab('classes-list')}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold py-1 px-3 rounded"
                >
                  Create Class Group
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 xl:grid-cols-6 gap-2">
                {classes.map((cls) => {
                  const slotsCount = timetable.filter(t => t.classId === cls.id).length;
                  const holidaySlotsCount = timetable.filter(t => t.classId === cls.id && t.status === 'Holiday').length;
                  const isClassActive = selectedClassId === cls.id;

                  return (
                    <button
                      key={cls.id}
                      onClick={() => {
                        setSelectedClassId(cls.id);
                        setSearchQuery('');
                      }}
                      className={`text-left p-3 rounded-lg border transition-all cursor-pointer ${
                        isClassActive
                          ? 'bg-blue-600 text-white border-blue-600 shadow-3xs'
                          : 'bg-slate-50 hover:bg-slate-100/70 text-slate-700 border-slate-200'
                      }`}
                    >
                      <span className="block font-bold text-xs sm:text-sm truncate">
                        {cls.name}
                      </span>
                      <span className={`text-[10px] block mt-0.5 font-mono ${
                        isClassActive ? 'text-blue-10' : 'text-slate-400'
                      }`}>
                        {slotsCount} lecture{slotsCount !== 1 ? 's' : ''} {holidaySlotsCount > 0 ? `(${holidaySlotsCount} H)` : ''}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Active Class Timetable Control Board */}
          {activeClassGroup && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              
              {/* Left Column: Selector sidebar controls & Stats Metrics */}
              <div className="lg:col-span-4 bg-white border border-slate-200 rounded-lg p-5 shadow-3xs space-y-5 h-fit">
                <div>
                  <h3 className="font-bold text-slate-900 text-base tracking-tight font-sans">
                    {activeClassGroup.name} Profile
                  </h3>
                  <p className="text-[11px] text-slate-450 uppercase font-bold tracking-widest font-mono mt-0.5">
                    {activeClassGroup.department} Directorate
                  </p>
                </div>

                {/* Statistics Counter Summary blocks */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 border border-slate-150 p-3 rounded-lg text-center">
                    <span className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-widest font-mono">Total Hours</span>
                    <span className="block text-2xl font-black text-slate-800 mt-1">{classTimetableEntries.length} hr(s)</span>
                  </div>

                  <div className="bg-slate-50 border border-slate-150 p-3 rounded-lg text-center">
                    <span className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-widest font-mono">Holidays Fixed</span>
                    <span className={`block text-2xl font-black mt-1 ${classTimetableEntries.filter(e => e.status === 'Holiday').length > 0 ? 'text-amber-600' : 'text-slate-600'}`}>
                      {classTimetableEntries.filter(e => e.status === 'Holiday').length}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-150 p-3 rounded-lg text-[11px] text-slate-500 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Selected Class ID:</span>
                    <span className="font-mono text-slate-805 select-all">{activeClassGroup.id}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Assigned Division:</span>
                    <span className="font-semibold text-slate-805">{activeClassGroup.department} Division</span>
                  </div>
                </div>

                {/* Quick actions for setting holidays or schedule adjustments */}
                <div className="space-y-2 pt-2 border-t border-slate-200">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Quick Class Actions</h4>
                  
                  <button
                    onClick={handleOpenCreateModal}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-3xs transition-colors"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Schedule Lecture Slot</span>
                  </button>

                  <div className="grid grid-cols-2 gap-1 px-1">
                    <button
                      onClick={() => handleToggleDayHolidayForClass('Monday')}
                      className="text-[10px] text-slate-650 hover:text-amber-800 hover:bg-amber-50 py-1 border border-slate-200 hover:border-amber-200 rounded text-center transition-all cursor-pointer font-medium"
                    >
                      🌴 Mon Holiday
                    </button>
                    <button
                      onClick={() => handleToggleDayHolidayForClass('Friday')}
                      className="text-[10px] text-slate-650 hover:text-amber-800 hover:bg-amber-50 py-1 border border-slate-200 hover:border-amber-200 rounded text-center transition-all cursor-pointer font-medium"
                    >
                      🌴 Fri Holiday
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Weekly Grid Ledger Timeline layout */}
              <div className="lg:col-span-8 space-y-4">
                
                {/* Search & Weekday Category Toggle Bar */}
                <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-3xs space-y-3.5">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200/60 font-sans">
                      <button
                        onClick={() => setSelectedDayFilter('All')}
                        className={`px-3 py-1 text-xs font-bold rounded ${
                          selectedDayFilter === 'All' ? 'bg-white text-slate-900 shadow-3xs' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        All Week
                      </button>
                      {DAYS_LIST.map(day => (
                        <button
                          key={day}
                          onClick={() => setSelectedDayFilter(day as any)}
                          className={`px-3 py-1 text-xs font-bold rounded ${
                            selectedDayFilter === day ? 'bg-white text-slate-900 shadow-3xs' : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          {day.substring(0,3)}
                        </button>
                      ))}
                    </div>

                    {/* Filter Text Search Input */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search subjects, rooms, faculty name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8 pr-3 py-1 border border-slate-250 rounded-lg text-xs outline-none focus:border-blue-500 bg-slate-50/50 focus:bg-white w-full md:w-56"
                      />
                    </div>
                  </div>
                </div>

                {/* Actual Timetable List */}
                <div className="bg-white border border-slate-200 rounded-lg shadow-3xs overflow-hidden">
                  <div className="border-b border-slate-150 px-5 py-4 flex items-center justify-between bg-slate-50">
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                      Weekly Timetable Ledger: {activeClassGroup.name}
                    </h4>
                    <span className="text-[10px] text-slate-400 font-mono tracking-wide uppercase font-semibold">
                      {selectedDayFilter === 'All' ? 'Complete Schedule' : selectedDayFilter} Filter
                    </span>
                  </div>

                  <div className="divide-y divide-slate-150">
                    {filteredAndSortedEntries.length === 0 ? (
                      <div className="p-12 text-center text-slate-400 text-xs font-sans">
                        No lecture slots found for {activeClassGroup.name} under these filters.
                        <button
                          onClick={handleOpenCreateModal}
                          className="text-blue-600 hover:underline block mx-auto mt-2 font-bold cursor-pointer"
                        >
                          + Add a lecture slot now
                        </button>
                      </div>
                    ) : (
                      filteredAndSortedEntries.map((entry) => {
                        const assignedTeacher = teachers.find(t => t.id === entry.teacherId);
                        const isHolidaySlot = entry.status === 'Holiday';
                        const isCancelled = entry.status === 'Cancelled';
                        const isRescheduled = entry.status === 'Rescheduled';

                        return (
                          <div
                            key={entry.id}
                            className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                              isHolidaySlot 
                                ? 'bg-amber-50/20 hover:bg-amber-55/20' 
                                : 'hover:bg-slate-50/40'
                            }`}
                          >
                            {/* Day and Timeslot Badge info block */}
                            <div className="flex items-start gap-3">
                              
                              <div className="text-center shrink-0">
                                <span className="block text-[10px] bg-slate-100 text-slate-600 font-bold border border-slate-200 px-2 py-0.5 rounded font-mono">
                                  {entry.dayOfWeek.substring(0,3)}
                                </span>
                                <span className="block font-mono text-[11px] font-bold text-slate-800 mt-1">
                                  {entry.startTime}
                                </span>
                                <span className="block font-mono text-[9px] text-slate-400">
                                  {entry.endTime}
                                </span>
                              </div>

                              {/* Course Details Block */}
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <h4 className={`text-sm font-bold tracking-tight ${
                                    isHolidaySlot ? 'text-amber-900 line-through' : 'text-slate-850'
                                  }`}>
                                    {entry.courseName}
                                  </h4>

                                  {/* Render badges for slot adjustments */}
                                  {isHolidaySlot && (
                                    <span className="bg-amber-100 text-amber-800 border border-amber-200 text-[8px] font-bold uppercase px-1 rounded flex items-center gap-0.5">
                                      <Coffee className="w-2.5 h-2.5" />
                                      Holiday
                                    </span>
                                  )}
                                  {isCancelled && (
                                    <span className="bg-red-50 text-red-700 border border-red-100 text-[8px] font-semibold px-1 rounded uppercase">
                                      Cancelled
                                    </span>
                                  )}
                                  {isRescheduled && (
                                    <span className="bg-orange-50 text-orange-700 border border-orange-100 text-[8px] font-semibold px-1 rounded uppercase">
                                      Rescheduled
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-2 text-xs text-slate-500 font-sans">
                                  <span className="flex items-center gap-0.5 font-medium text-slate-605">
                                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                    {assignedTeacher ? assignedTeacher.name : 'Not Assigned'}
                                  </span>
                                  <span className="text-slate-300">•</span>
                                  <span className="flex items-center gap-0.5">
                                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                    {entry.room}
                                  </span>
                                </div>
                              </div>

                            </div>

                            {/* Options action buttons to manage */}
                            <div className="flex items-center gap-2 self-end sm:self-center">
                              
                              <button
                                onClick={() => handleToggleSingleHoliday(entry)}
                                className={`px-2.5 py-1 rounded text-[10px] font-bold flex items-center gap-0.5 border cursor-pointer transition-colors ${
                                  isHolidaySlot 
                                    ? 'bg-amber-100 text-amber-800 border-amber-250' 
                                    : 'bg-white text-slate-650 hover:bg-amber-50 hover:text-amber-800 border-slate-205'
                                }`}
                                title="Toggle holiday closure"
                              >
                                <Coffee className="w-3 h-3 text-amber-500" />
                                <span>{isHolidaySlot ? 'Is Holiday' : 'Set Holiday'}</span>
                              </button>

                              <button
                                onClick={() => handleOpenEditModal(entry)}
                                className="p-1.5 bg-slate-50 hover:bg-blue-50 text-slate-500 hover:text-blue-600 rounded border border-slate-200 transition-colors cursor-pointer"
                                title="Edit scheduling times/teachers"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => {
                                  if (confirm(`Completely delete the scheduled slot '${entry.courseName}' scheduled for ${entry.dayOfWeek}?`)) {
                                    onDeleteTimetableEntry(entry.id);
                                  }
                                }}
                                className="p-1.5 bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded border border-slate-200 transition-colors cursor-pointer"
                                title="Delete this entry block"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>

                            </div>

                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Sync confirmation box */}
                <div className="bg-sky-50 border border-sky-150 rounded-lg p-3.5 flex items-start gap-2.5 text-xs text-sky-850 leading-relaxed font-sans">
                  <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Faculty Sync Active:</span> The configurations declared in this admin timetable editor are dynamically synchronized, instantly affecting corresponding teachers and scheduling queues on their personal dashboards.
                  </div>
                </div>

              </div>

            </div>
          )}

        </div>
      )}

      {/* VIEW SECTION B: INSTITUTIONAL CLASS DIRECTORY */}
      {activeTab === 'classes-list' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-3xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base font-sans">Registered Class Groups & Cohorts</h3>
              <p className="text-xs text-slate-405 font-sans">Configure directory records mapping sections, core cohorts, and divisions</p>
            </div>
            <button
              onClick={() => {
                setClassFormName('');
                setIsClassModalOpen(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 px-4 rounded-lg shadow-3xs cursor-pointer flex items-center gap-1.5 transition-colors select-none"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Class Section</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {classes.map((cls) => {
              const activeLecturesCount = timetable.filter(e => e.classId === cls.id).length;

              return (
                <div key={cls.id} className="bg-white border border-slate-200 rounded-lg p-5 shadow-3xs hover:shadow-2xs transition-all flex flex-col justify-between">
                  <div className="space-y-3.5">
                    <div className="flex items-center gap-3">
                      <div className="bg-slate-50 p-2.5 rounded-lg text-slate-700 border border-slate-200">
                        <Layers className="w-4.5 h-4.5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm sm:text-base font-sans">{cls.name}</h4>
                        <span className="text-[10px] bg-blue-50 text-blue-800 border border-blue-100 font-bold uppercase px-1.5 py-0.5 rounded-sm">
                          {cls.department} Branch
                        </span>
                      </div>
                    </div>

                    <div className="bg-slate-50/50 p-2.5 rounded text-xs space-y-1 text-slate-500 font-sans border border-slate-150">
                      <div>Scheduled timetable lectures: <span className="font-bold text-slate-800">{activeLecturesCount} slot(s)</span></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end pt-3 mt-4 border-t border-slate-150">
                    <button
                      onClick={() => {
                        if (confirm(`Are you sure you want to dismiss the session cohort '${cls.name}'? Grade rosters and timetable hours connected to this Section will be unlinked.`)) {
                          onDeleteClass(cls.id);
                        }
                      }}
                      className="flex items-center justify-center gap-1 text-[11px] font-bold text-red-500 hover:text-red-750 font-sans cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-0.5" />
                      De-register Cohort
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL 1: ADD CLASS COHORT */}
      {isClassModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg w-full max-w-md shadow-lg overflow-hidden border border-slate-150">
            <div className="border-b border-slate-150 px-5 py-3 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-800 text-sm font-sans">Register Class Cohort Section</h3>
              <button onClick={() => setIsClassModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateClass} className="p-5 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-600 block">Class Name *</label>
                <input
                  type="text"
                  required
                  value={classFormName}
                  onChange={(e) => setClassFormName(e.target.value)}
                  placeholder="e.g. Grade 10-Science A"
                  className="w-full border border-slate-205 rounded px-3 py-2 text-sm outline-none font-sans bg-white focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-600 block">Faculty Branch / Department *</label>
                <select
                  required
                  value={classFormDept}
                  onChange={(e) => setClassFormDept(e.target.value)}
                  className="w-full border border-slate-205 rounded px-3 py-2 text-sm outline-none font-sans bg-transparent focus:border-blue-500"
                >
                  {DEPT_TYPES.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              <div className="pt-4 border-t border-slate-150 flex items-center justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setIsClassModalOpen(false)}
                  className="hover:bg-slate-100 text-slate-705 px-3 py-1.5 rounded cursor-pointer font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-1.5 rounded-lg cursor-pointer"
                >
                  Save Section
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: SCHEDULING DIALOG (ADD / EDIT) */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg w-full max-w-lg shadow-lg overflow-hidden border border-slate-150 focus-within:ring-0">
            <div className="border-b border-slate-150 px-5 py-3 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-800 text-sm font-sans flex items-center gap-1">
                <Sparkles className="w-4 h-4 text-blue-500" />
                <span>{editingEntry ? 'Edit Lecture Schedule Slot' : 'Schedule Lecture Slot'}</span>
              </h3>
              <button 
                onClick={() => {
                  setIsScheduleModalOpen(false);
                  setEditingEntry(null);
                }} 
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveSchedule} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-650">Target Class Section *</label>
                  <select
                    value={schedClassId}
                    onChange={(e) => setSchedClassId(e.target.value)}
                    className="w-full border border-slate-205 rounded px-2.5 py-1.5 outline-none font-sans"
                  >
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-650">Course Subject Title *</label>
                  <input
                    type="text"
                    required
                    value={schedCourse}
                    onChange={(e) => setSchedCourse(e.target.value)}
                    placeholder="e.g. Physics Quantum Mechanics"
                    className="w-full border border-slate-205 rounded px-2.5 py-1.5 outline-none font-sans"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-650">Assigned Educator *</label>
                  <select
                    value={schedTeacherId}
                    onChange={(e) => setSchedTeacherId(e.target.value)}
                    className="w-full border border-slate-205 rounded px-2.5 py-1.5 outline-none font-sans bg-transparent"
                  >
                    {teachers.map(t => (
                      <option key={t.id} value={t.id}>{t.name} ({t.department})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-650">Day Of Week *</label>
                  <select
                    value={schedDay}
                    onChange={(e) => setSchedDay(e.target.value as any)}
                    className="w-full border border-slate-205 rounded px-2.5 py-1.5 outline-none font-sans"
                  >
                    {DAYS_LIST.map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-650">Start Hour Slot *</label>
                  <input
                    type="time"
                    required
                    value={schedStart}
                    onChange={(e) => setSchedStart(e.target.value)}
                    className="w-full border border-slate-205 rounded px-2.5 py-1.5 font-mono outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-650">End Hour Slot *</label>
                  <input
                    type="time"
                    required
                    value={schedEnd}
                    onChange={(e) => setSchedEnd(e.target.value)}
                    className="w-full border border-slate-205 rounded px-2.5 py-1.5 font-mono outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-650">Room / Space *</label>
                  <input
                    type="text"
                    required
                    value={schedRoom}
                    onChange={(e) => setSchedRoom(e.target.value)}
                    placeholder="e.g. Auditorium Room 4"
                    className="w-full border border-slate-205 rounded px-2.5 py-1.5 outline-none font-sans"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-650">Lecture Status Class *</label>
                  <select
                    value={schedStatus}
                    onChange={(e) => setSchedStatus(e.target.value as any)}
                    className="w-full border border-slate-205 rounded px-2.5 py-1.5 outline-none font-sans"
                  >
                    <option value="Active">🟢 Active Lecture</option>
                    <option value="Holiday">🌴 Holiday</option>
                    <option value="Rescheduled">🟡 Rescheduled</option>
                    <option value="Cancelled">🔴 Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-150 flex items-center justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setIsScheduleModalOpen(false);
                    setEditingEntry(null);
                  }}
                  className="hover:bg-slate-100 text-slate-705 px-3 py-1.5 rounded cursor-pointer font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-1.5 rounded-lg cursor-pointer"
                >
                  {editingEntry ? 'Confirm Updates' : 'Schedule Hour'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
