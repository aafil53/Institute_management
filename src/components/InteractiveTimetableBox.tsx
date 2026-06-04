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
  X, 
  Save, 
  Check, 
  Coffee, 
  ShieldAlert,
  Unlock,
  Lock,
  Sparkles
} from 'lucide-react';

interface InteractiveTimetableBoxProps {
  classes: ClassGroup[];
  timetable: TimetableEntry[];
  teachers: Teacher[];
  currentRole: 'admin' | 'teacher';
  onAddTimetableEntry: (entry: Omit<TimetableEntry, 'id'>) => void;
  onDeleteTimetableEntry: (entryId: string) => void;
  onUpdateTimetableEntry: (entry: TimetableEntry) => void;
  activeDay: string;
  setActiveDay: (day: string) => void;
}

export default function InteractiveTimetableBox({
  classes,
  timetable,
  teachers,
  currentRole,
  onAddTimetableEntry,
  onDeleteTimetableEntry,
  onUpdateTimetableEntry,
  activeDay,
  setActiveDay
}: InteractiveTimetableBoxProps) {
  // Allow switching admin powers on/off inside this box for quick testing
  const [adminOverride, setAdminOverride] = useState(currentRole === 'admin');
  const isAuthorized = currentRole === 'admin' || adminOverride;

  // View state filters
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals / forms state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimetableEntry | null>(null);

  // Form states (Add/Edit Shared)
  const [formClassId, setFormClassId] = useState('');
  const [formCourse, setFormCourse] = useState('');
  const [formTeacherId, setFormTeacherId] = useState('');
  const [formDay, setFormDay] = useState<string>('Monday');
  const [formStart, setFormStart] = useState('09:00');
  const [formEnd, setFormEnd] = useState('10:00');
  const [formRoom, setFormRoom] = useState('Room 101');
  const [formStatus, setFormStatus] = useState<any>('Active');

  const DAYS_LIST = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  // Initialize add form values to defaults
  const openAddForm = () => {
    setFormClassId(classes[0]?.id || '');
    setFormTeacherId(teachers[0]?.id || '');
    setFormCourse('');
    setFormDay(activeDay);
    setFormStart('09:00');
    setFormEnd('10:00');
    setFormRoom('Room 101');
    setFormStatus('Active');
    setIsAddOpen(true);
    setEditingEntry(null);
  };

  // Initialize edit form values
  const openEditForm = (entry: TimetableEntry) => {
    setEditingEntry(entry);
    setFormClassId(entry.classId);
    setFormTeacherId(entry.teacherId);
    setFormCourse(entry.courseName);
    setFormDay(entry.dayOfWeek);
    setFormStart(entry.startTime);
    setFormEnd(entry.endTime);
    setFormRoom(entry.room);
    setFormStatus(entry.status || 'Active');
    setIsAddOpen(false);
  };

  // Handle submissions
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formClassId || !formCourse.trim() || !formTeacherId || !formStart || !formEnd || !formRoom.trim()) {
      alert('Please complete all requested timetable fields!');
      return;
    }

    if (editingEntry) {
      // Perform Edit Update
      onUpdateTimetableEntry({
        id: editingEntry.id,
        classId: formClassId,
        courseName: formCourse,
        teacherId: formTeacherId,
        dayOfWeek: formDay as any,
        startTime: formStart,
        endTime: formEnd,
        room: formRoom,
        status: formStatus
      });
      setEditingEntry(null);
    } else {
      // Perform Creation
      onAddTimetableEntry({
        classId: formClassId,
        courseName: formCourse,
        teacherId: formTeacherId,
        dayOfWeek: formDay as any,
        startTime: formStart,
        endTime: formEnd,
        room: formRoom,
        status: formStatus
      });
      setIsAddOpen(false);
    }
  };

  // Instant toggles
  const handleToggleHoliday = (entry: TimetableEntry) => {
    const isHoliday = entry.status === 'Holiday';
    onUpdateTimetableEntry({
      ...entry,
      status: isHoliday ? 'Active' : 'Holiday'
    });
  };

  // Bulk Holiday Mark
  const handleToggleWholeDayHoliday = () => {
    // Filter classes belonging to the specific active day
    const activeDaySessions = timetable.filter(e => e.dayOfWeek === activeDay);
    
    if (activeDaySessions.length === 0) {
      alert(`No lectures scheduled on ${activeDay} to toggle!`);
      return;
    }

    // Check if everything is already a holiday
    const allHolidays = activeDaySessions.every(e => e.status === 'Holiday');
    
    // Toggle all
    const promptString = allHolidays 
      ? `Re-activate all lectures on ${activeDay}?`
      : `Declare a school holiday for the entire day of ${activeDay}? This will mark all scheduled lectures on this day as 'Holiday'.`;

    if (confirm(promptString)) {
      activeDaySessions.forEach(entry => {
        onUpdateTimetableEntry({
          ...entry,
          status: allHolidays ? 'Active' : 'Holiday'
        });
      });
    }
  };

  // Calculate stats
  const pageFilteredEntries = useMemo(() => {
    return timetable.filter(entry => {
      // Day filter
      if (entry.dayOfWeek !== activeDay) return false;

      // Search queries matching Class, Course, or Teacher names
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const clsName = classes.find(c => c.id === entry.classId)?.name.toLowerCase() || '';
        const course = entry.courseName.toLowerCase();
        const teachName = teachers.find(t => t.id === entry.teacherId)?.name.toLowerCase() || '';
        const room = entry.room.toLowerCase();
        return clsName.includes(query) || course.includes(query) || teachName.includes(query) || room.includes(query);
      }
      return true;
    }).sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [timetable, activeDay, searchQuery, classes, teachers]);

  const isWholeDayHoliday = useMemo(() => {
    const daySessions = timetable.filter(e => e.dayOfWeek === activeDay);
    return daySessions.length > 0 && daySessions.every(e => e.status === 'Holiday');
  }, [timetable, activeDay]);

  return (
    <div id="interactive-timetable-widget" className="bg-white border border-slate-200 rounded-lg shadow-3xs overflow-hidden">
      
      {/* Widget Header Toolbar */}
      <div className="bg-slate-50 border-b border-slate-200 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-slate-900 text-sm font-sans">Lecture Timetable & Holidays</h3>
          </div>
          <p className="text-[11px] text-slate-400 font-sans mt-0.5">
            Configure administrative lecture slots, rooms, and national school holidays
          </p>
        </div>

        {/* Sandbox Override Switch */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setAdminOverride(prev => !prev)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-bold font-sans uppercase border transition-all cursor-pointer ${
              isAuthorized 
                ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-3xs' 
                : 'bg-slate-50 text-slate-450 border-slate-200'
            }`}
          >
            {isAuthorized ? (
              <>
                <Unlock className="w-3 h-3 text-blue-600" />
                <span>Admin Mode Active</span>
              </>
            ) : (
              <>
                <Lock className="w-3 h-3 text-slate-400" />
                <span>View Only (Enable Admin Edit)</span>
              </>
            )}
          </button>

          {isAuthorized && (
            <button
              onClick={openAddForm}
              className="bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold px-3 py-1.5 rounded cursor-pointer transition-colors flex items-center gap-1"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Add Lecture
            </button>
          )}
        </div>
      </div>

      {/* Weekday Switcher Toolbar */}
      <div className="border-b border-slate-150 p-3 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1">
          {DAYS_LIST.map((day) => {
            const sessionsForDay = timetable.filter(e => e.dayOfWeek === day);
            const holidayCount = sessionsForDay.filter(e => e.status === 'Holiday').length;
            const isDayHoliday = sessionsForDay.length > 0 && holidayCount === sessionsForDay.length;

            return (
              <button
                key={day}
                onClick={() => {
                  setActiveDay(day);
                  setIsAddOpen(false);
                  setEditingEntry(null);
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded cursor-pointer transition-all flex items-center gap-1 ${
                  activeDay === day
                    ? 'bg-slate-900 text-white font-bold'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-650 border border-slate-200'
                }`}
              >
                <span>{day.substring(0, 3)}</span>
                {sessionsForDay.length > 0 && (
                  <span className={`text-[9px] px-1 rounded-sm ${
                    activeDay === day 
                      ? 'bg-white/20 text-white' 
                      : isDayHoliday 
                        ? 'bg-amber-100 text-amber-800' 
                        : 'bg-slate-200 text-slate-700'
                  }`}>
                    {isDayHoliday ? '🌴' : sessionsForDay.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Dynamic Holiday Declare Toolbar */}
        {isAuthorized && (
          <button
            onClick={handleToggleWholeDayHoliday}
            className={`text-xs px-3 py-1.5 rounded font-bold cursor-pointer transition-all flex items-center gap-1.5 ${
              isWholeDayHoliday 
                ? 'bg-amber-100 hover:bg-amber-150 text-amber-800 border border-amber-200'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-750 border border-slate-250'
            }`}
          >
            <Coffee className="w-3.5 h-3.5 text-amber-600" />
            <span>{isWholeDayHoliday ? 'Re-activate Day' : 'Mark Entire Day as Holiday'}</span>
          </button>
        )}
      </div>

      {/* Main Panel Frame */}
      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-150">
        
        {/* Left Side: Adding or Editing Forms (Occupies 4 cols if open) */}
        {(isAddOpen || editingEntry) ? (
          <div className="lg:col-span-4 p-4 bg-slate-50/50">
            <div className="flex items-center justify-between mb-3 pb-1.5 border-b border-slate-200">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wide">
                <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                {editingEntry ? 'Edit Lecture Slot' : 'Add Lecture Slot'}
              </span>
              <button 
                onClick={() => {
                  setIsAddOpen(false);
                  setEditingEntry(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-0.5 rounded hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-600 block mb-1">Class Cohort Group</label>
                <select
                  value={formClassId}
                  onChange={(e) => setFormClassId(e.target.value)}
                  className="w-full bg-white border border-slate-250 rounded px-2 py-1.5 outline-none focus:border-blue-500"
                >
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-600 block mb-1">Subject / Course Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Physics Core"
                  value={formCourse}
                  onChange={(e) => setFormCourse(e.target.value)}
                  className="w-full bg-white border border-slate-250 rounded px-2 py-1.5 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-600 block mb-1">Assigned Teacher</label>
                <select
                  value={formTeacherId}
                  onChange={(e) => setFormTeacherId(e.target.value)}
                  className="w-full bg-white border border-slate-250 rounded px-2 py-1.5 outline-none focus:border-blue-500"
                >
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.department})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-600 block mb-1">Scheduled Day</label>
                  <select
                    value={formDay}
                    onChange={(e) => setFormDay(e.target.value)}
                    className="w-full bg-white border border-slate-250 rounded px-2 py-1.5 outline-none focus:border-blue-500"
                  >
                    {DAYS_LIST.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-600 block mb-1">Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full bg-white border border-slate-250 rounded px-2 py-1.5 outline-none focus:border-blue-500"
                  >
                    <option value="Active">🟢 Active</option>
                    <option value="Holiday">🌴 Holiday</option>
                    <option value="Rescheduled">🟡 Rescheduled</option>
                    <option value="Cancelled">🔴 Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-600 block mb-1">Start Time</label>
                  <input
                    type="time"
                    required
                    value={formStart}
                    onChange={(e) => setFormStart(e.target.value)}
                    className="w-full bg-white border border-slate-250 rounded px-2 py-1.5 font-mono outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-600 block mb-1">End Time</label>
                  <input
                    type="time"
                    required
                    value={formEnd}
                    onChange={(e) => setFormEnd(e.target.value)}
                    className="w-full bg-white border border-slate-250 rounded px-2 py-1.5 font-mono outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-600 block mb-1">Classroom Room / Location</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Science Suite Room A"
                  value={formRoom}
                  onChange={(e) => setFormRoom(e.target.value)}
                  className="w-full bg-white border border-slate-250 rounded px-2 py-1.5 outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-2 border-t border-slate-150 flex items-center justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddOpen(false);
                    setEditingEntry(null);
                  }}
                  className="hover:bg-slate-200 text-slate-705 px-2.5 py-1.5 rounded cursor-pointer font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-1.5 rounded cursor-pointer"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        ) : null}

        {/* Right Side: Ledger of Lectures (Occupies remaining columns) */}
        <div className={`p-4 ${ (isAddOpen || editingEntry) ? 'lg:col-span-8' : 'lg:col-span-12' }`}>
          
          {/* Quick search input */}
          <div className="mb-3.5">
            <input
              type="text"
              placeholder="🔍 Search schedules by class, subject, teacher name, room..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border border-slate-250 rounded px-3 py-1.5 text-xs outline-none bg-slate-50/50 focus:bg-white focus:border-blue-500 font-sans transition-all"
            />
          </div>

          <div className="space-y-2">
            {pageFilteredEntries.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 border border-slate-150 rounded text-xs text-slate-400 font-sans">
                {searchQuery ? 'No results found matching search terms' : `No lectures scheduled on ${activeDay}.`}
              </div>
            ) : (
              pageFilteredEntries.map((entry) => {
                const isHoliday = entry.status === 'Holiday';
                const isCancelled = entry.status === 'Cancelled';
                const isRescheduled = entry.status === 'Rescheduled';
                const clsName = classes.find(c => c.id === entry.classId)?.name || 'Class';
                const teachObj = teachers.find(t => t.id === entry.teacherId);

                return (
                  <div
                    key={entry.id}
                    className={`p-3 border rounded-lg transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isHoliday 
                        ? 'bg-amber-50/20 border-amber-150/70' 
                        : isCancelled 
                          ? 'bg-rose-50/10 border-rose-100' 
                          : 'bg-white border-slate-200 hover:bg-slate-50/30'
                    }`}
                  >
                    
                    {/* Schedule block description */}
                    <div className="flex items-start gap-3">
                      
                      {/* Left Side Clock format block */}
                      <div className={`p-2 rounded text-center shrink-0 min-w-[72px] border ${
                        isHoliday 
                          ? 'bg-amber-50 text-amber-800 border-amber-150' 
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}>
                        <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center justify-center gap-0.5 mb-0.5">
                          <Clock className="w-3 h-3 text-current" />
                          <span>Slot</span>
                        </div>
                        <div className="font-mono text-[11px] font-bold leading-tight">
                          {entry.startTime}
                        </div>
                        <div className="font-mono text-[9px] text-slate-400 font-medium">
                          {entry.endTime}
                        </div>
                      </div>

                      {/* Course subject text */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[10px] py-0.5 px-2 font-bold font-mono rounded ${
                            isHoliday 
                              ? 'bg-amber-100 text-amber-800' 
                              : 'bg-blue-50 text-blue-700'
                          }`}>
                            {clsName}
                          </span>
                          
                          {/* Badges for status flags */}
                          {isHoliday && (
                            <span className="bg-amber-500 text-white text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded leading-none flex items-center gap-0.5 font-mono">
                              <Coffee className="w-2.5 h-2.5" />
                              Holiday Day-off
                            </span>
                          )}
                          {isCancelled && (
                            <span className="bg-rose-600 text-white text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded leading-none font-mono">
                              Cancelled
                            </span>
                          )}
                          {isRescheduled && (
                            <span className="bg-amber-400 text-slate-900 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded leading-none font-mono">
                              Rescheduled
                            </span>
                          )}
                        </div>

                        <h4 className={`text-sm tracking-tight font-bold ${
                          isHoliday ? 'text-amber-900 line-through' : 'text-slate-850'
                        }`}>
                          {entry.courseName}
                        </h4>

                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-450 font-sans">
                          <span className="flex items-center gap-0.5 font-normal text-slate-600">
                            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            {teachObj ? teachObj.name : 'Unassigned'}
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="flex items-center gap-0.5 text-slate-500">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            {entry.room}
                          </span>
                        </div>
                      </div>

                    </div>

                    {/* Action controls panel */}
                    <div className="flex items-center justify-end gap-1.5 self-end sm:self-center">
                      
                      {/* Interactive Holiday quick toggle button */}
                      {isAuthorized && (
                        <button
                          type="button"
                          onClick={() => handleToggleHoliday(entry)}
                          className={`px-2 py-1.5 text-[10px] font-bold rounded cursor-pointer transition-colors border flex items-center gap-1 ${
                            isHoliday 
                              ? 'bg-amber-100 text-amber-800 border-amber-250 hover:bg-amber-150' 
                              : 'bg-white text-slate-600 border-slate-300 hover:bg-amber-50 hover:text-amber-800 hover:border-amber-200'
                          }`}
                          title="Instant School Holiday toggle switch"
                        >
                          <Coffee className="w-3 h-3 text-amber-500" />
                          <span>{isHoliday ? 'Is Holiday' : 'Set Holiday'}</span>
                        </button>
                      )}

                      {/* Modify Buttons */}
                      {isAuthorized ? (
                        <>
                          <button
                            type="button"
                            onClick={() => openEditForm(entry)}
                            className="p-1.5 bg-slate-50 text-slate-500 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 rounded transition-colors cursor-pointer"
                            title="Edit schedule particulars"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Are you sure you want to completely erase the scheduled course '${entry.courseName}' for Class '${clsName}'?`)) {
                                onDeleteTimetableEntry(entry.id);
                              }
                            }}
                            className="p-1.5 bg-slate-50 text-slate-400 hover:text-red-650 hover:bg-rose-50 border border-slate-200 rounded transition-colors cursor-pointer"
                            title="Remove Slot completely"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">
                          {isHoliday ? 'Holiday Closure' : 'Active Lecture'}
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

    </div>
  );
}
