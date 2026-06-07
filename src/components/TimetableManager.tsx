import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import {
    Plus, Trash2, X, Save, ChevronDown,
    User, AlertCircle, CheckCircle2, Loader
} from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;
type Day = typeof DAYS[number];

const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8] as const;
type Period = typeof PERIODS[number];

type SlotType = 'class' | 'holiday' | 'free' | 'teacher_absent' | 'school_function';

interface TimetableSlot {
    id: string;
    class_id: string;
    day_of_week: Day;
    period_number: Period;
    slot_type: SlotType;
    subject: string | null;
    teacher_id: string | null;
    teacher_name?: string;
    start_time: string;
    end_time: string;
    note: string | null;
}

interface ClassOption { id: string; name: string; }
interface TeacherOption { id: string; name: string; department: string; }

interface SlotModalState {
    open: boolean;
    day: Day;
    period: Period;
    existing: TimetableSlot | null;
}

const SLOT_COLORS: Record<SlotType, string> = {
    class: 'bg-blue-50 border-blue-200 text-blue-900',
    holiday: 'bg-amber-50 border-amber-300 text-amber-900',
    free: 'bg-green-50 border-green-200 text-green-900',
    teacher_absent: 'bg-red-50 border-red-200 text-red-900',
    school_function: 'bg-purple-50 border-purple-200 text-purple-900',
};

const SLOT_LABELS: Record<SlotType, string> = {
    class: 'Class',
    holiday: 'Holiday',
    free: 'Free Period',
    teacher_absent: 'Teacher Absent',
    school_function: 'School Function',
};

const SLOT_TYPES: SlotType[] = ['class', 'holiday', 'free', 'teacher_absent', 'school_function'];

const DEFAULT_TIMES: Record<Period, { start: string; end: string }> = {
    1: { start: '08:00', end: '08:45' },
    2: { start: '08:45', end: '09:30' },
    3: { start: '09:30', end: '10:15' },
    4: { start: '10:30', end: '11:15' },
    5: { start: '11:15', end: '12:00' },
    6: { start: '12:00', end: '12:45' },
    7: { start: '13:30', end: '14:15' },
    8: { start: '14:15', end: '15:00' },
};

// Ensures time is always in HH:MM:SS format for PostgreSQL TIME columns
function toPostgresTime(time: string): string {
    if (!time) return '00:00:00';
    // Already HH:MM:SS
    if (time.length === 8) return time;
    // HH:MM → HH:MM:SS
    if (time.length === 5) return time + ':00';
    return time;
}

export default function TimetableManager() {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';

    const [classes, setClasses] = useState<ClassOption[]>([]);
    const [teachers, setTeachers] = useState<TeacherOption[]>([]);
    const [selectedClassId, setSelectedClassId] = useState<string>('');
    const [slots, setSlots] = useState<TimetableSlot[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

    const [modal, setModal] = useState<SlotModalState>({
        open: false, day: 'Monday', period: 1, existing: null
    });

    // form state
    const [fType, setFType] = useState<SlotType>('class');
    const [fSubject, setFSubject] = useState('');
    const [fTeacherId, setFTeacherId] = useState('');
    const [fStart, setFStart] = useState('08:00');
    const [fEnd, setFEnd] = useState('08:45');
    const [fNote, setFNote] = useState('');

    const showToast = (msg: string, type: 'success' | 'error') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 4000);
    };

    useEffect(() => {
        supabase.from('classes').select('id, name').order('name').then(({ data, error }) => {
            if (error) console.error('Classes load error:', error);
            if (data && data.length > 0) {
                setClasses(data);
                // Only set if not already set
                setSelectedClassId(prev => prev || data[0].id);
            }
        });
    }, []);

    useEffect(() => {
        supabase.from('teachers').select('id, name, department').order('name').then(({ data, error }) => {
            if (error) console.error('Teachers load error:', error);
            if (data) setTeachers(data);
        });
    }, []);

    const loadSlots = useCallback(async () => {
        if (!selectedClassId) return;
        setLoading(true);
        const { data, error } = await supabase
            .from('timetable_slots')
            .select('*, teachers(name)')
            .eq('class_id', selectedClassId);

        if (error) {
            console.error('Load slots error:', error);
            showToast('Failed to load timetable: ' + error.message, 'error');
        } else {
            setSlots((data || []).map((s: any) => ({
                ...s,
                teacher_name: s.teachers?.name ?? null,
            })));
        }
        setLoading(false);
    }, [selectedClassId]);

    useEffect(() => { loadSlots(); }, [loadSlots]);

    const getSlot = (day: Day, period: Period): TimetableSlot | undefined =>
        slots.find(s => s.day_of_week === day && s.period_number === period);

    const openModal = (day: Day, period: Period) => {
        if (!selectedClassId) {
            showToast('Please select a class first', 'error');
            return;
        }
        const existing = getSlot(day, period) || null;
        setModal({ open: true, day, period, existing });
        if (existing) {
            setFType(existing.slot_type);
            setFSubject(existing.subject || '');
            setFTeacherId(existing.teacher_id || '');
            setFStart(existing.start_time.slice(0, 5));
            setFEnd(existing.end_time.slice(0, 5));
            setFNote(existing.note || '');
        } else {
            const defaults = DEFAULT_TIMES[period];
            setFType('class');
            setFSubject('');
            setFTeacherId('');
            setFStart(defaults.start);
            setFEnd(defaults.end);
            setFNote('');
        }
    };

    const closeModal = () => setModal(m => ({ ...m, open: false }));

    const handleSave = async () => {
        if (fType === 'class' && !fSubject.trim()) {
            showToast('Subject is required for a class period', 'error');
            return;
        }

        if (!selectedClassId) {
            showToast('Please select a class first', 'error');
            return;
        }

        setSaving(true);

        const payload = {
            class_id: selectedClassId,
            day_of_week: modal.day,
            period_number: modal.period,
            slot_type: fType,
            subject: fType === 'class' ? fSubject.trim() : null,
            teacher_id: fType === 'class' && fTeacherId ? fTeacherId : null,
            start_time: toPostgresTime(fStart),   // ✅ HH:MM:SS
            end_time: toPostgresTime(fEnd),         // ✅ HH:MM:SS
            note: fNote.trim() || null,
        };

        console.log('Saving payload:', payload);

        let error;

        if (modal.existing) {
            const result = await supabase
                .from('timetable_slots')
                .update(payload)
                .eq('id', modal.existing.id);
            error = result.error;
        } else {
            const result = await supabase
                .from('timetable_slots')
                .insert([payload]);
            error = result.error;
        }

        if (error) {
            console.error('Save error full details:', error);
            showToast('Failed to save: ' + error.message, 'error');
        } else {
            showToast('Saved successfully', 'success');
            closeModal();
            loadSlots();
        }

        setSaving(false);
    };

    const handleDelete = async () => {
        if (!modal.existing) return;
        setSaving(true);

        const { error } = await supabase
            .from('timetable_slots')
            .delete()
            .eq('id', modal.existing.id);

        if (error) {
            console.error('Delete error:', error);
            showToast('Failed to delete: ' + error.message, 'error');
        } else {
            showToast('Period cleared', 'success');
            closeModal();
            loadSlots();
        }

        setSaving(false);
    };

    const selectedClass = classes.find(c => c.id === selectedClassId);

    return (
        <div className="space-y-5">
            {/* Toast */}
            {toast && (
                <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-semibold border ${toast.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-red-50 text-red-800 border-red-200'
                    }`}>
                    {toast.type === 'success'
                        ? <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        : <AlertCircle className="w-4 h-4 text-red-600" />}
                    {toast.msg}
                </div>
            )}

            {/* Header */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-xs">
                <div>
                    <h2 className="text-lg font-bold text-slate-900">Timetable Manager</h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                        {isAdmin ? 'Click any cell to add or edit a period' : 'Read-only view of the class timetable'}
                    </p>
                </div>

                <div className="relative">
                    <select
                        value={selectedClassId}
                        onChange={e => setSelectedClassId(e.target.value)}
                        className="appearance-none bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 pr-8 text-sm font-semibold text-slate-800 outline-none focus:border-blue-500 cursor-pointer"
                    >
                        {classes.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-2">
                {SLOT_TYPES.map(t => (
                    <span key={t} className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${SLOT_COLORS[t]}`}>
                        {SLOT_LABELS[t]}
                    </span>
                ))}
                {isAdmin && (
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full border border-dashed border-slate-300 text-slate-400 bg-white">
                        Empty — click to add
                    </span>
                )}
            </div>

            {/* Timetable Grid */}
            {loading ? (
                <div className="flex items-center justify-center py-20 text-slate-400">
                    <Loader className="w-5 h-5 animate-spin mr-2" />
                    Loading timetable...
                </div>
            ) : (
                <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-sm">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider w-28 border-r border-slate-200">
                                        Period
                                    </th>
                                    {DAYS.map(day => (
                                        <th key={day} className="text-center px-3 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider border-r border-slate-200 last:border-r-0 min-w-[130px]">
                                            {day}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {PERIODS.map(period => (
                                    <tr key={period} className="border-b border-slate-100 last:border-b-0">
                                        <td className="px-4 py-3 border-r border-slate-200 bg-slate-50/50">
                                            <div className="font-bold text-slate-700 text-xs">Period {period}</div>
                                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                                {DEFAULT_TIMES[period].start}–{DEFAULT_TIMES[period].end}
                                            </div>
                                        </td>

                                        {DAYS.map(day => {
                                            const slot = getSlot(day, period);
                                            return (
                                                <td key={day} className="p-1.5 border-r border-slate-100 last:border-r-0 align-top">
                                                    {slot ? (
                                                        <div
                                                            onClick={() => isAdmin && openModal(day, period)}
                                                            className={`rounded-lg border p-2 min-h-[64px] transition-all ${SLOT_COLORS[slot.slot_type]} ${isAdmin ? 'cursor-pointer hover:opacity-80' : ''}`}
                                                        >
                                                            <div className="text-[10px] font-bold uppercase tracking-wider opacity-60 mb-0.5">
                                                                {SLOT_LABELS[slot.slot_type]}
                                                            </div>
                                                            {slot.slot_type === 'class' && (
                                                                <>
                                                                    <div className="font-bold text-xs leading-tight">{slot.subject}</div>
                                                                    {slot.teacher_name && (
                                                                        <div className="text-[10px] opacity-70 mt-0.5 flex items-center gap-0.5">
                                                                            <User className="w-2.5 h-2.5" />
                                                                            {slot.teacher_name}
                                                                        </div>
                                                                    )}
                                                                </>
                                                            )}
                                                            {slot.note && (
                                                                <div className="text-[10px] opacity-60 mt-0.5 italic">{slot.note}</div>
                                                            )}
                                                            <div className="text-[9px] font-mono opacity-50 mt-1">
                                                                {slot.start_time.slice(0, 5)}–{slot.end_time.slice(0, 5)}
                                                            </div>
                                                        </div>
                                                    ) : isAdmin ? (
                                                        <button
                                                            onClick={() => openModal(day, period)}
                                                            className="w-full min-h-[64px] rounded-lg border border-dashed border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 transition-all flex items-center justify-center group"
                                                        >
                                                            <Plus className="w-4 h-4 text-slate-300 group-hover:text-blue-400 transition-colors" />
                                                        </button>
                                                    ) : (
                                                        <div className="min-h-[64px] rounded-lg bg-slate-50/50 border border-slate-100" />
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {modal.open && isAdmin && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-xl border border-slate-200 overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
                            <div>
                                <h3 className="font-bold text-slate-900 text-base">
                                    {modal.day} — Period {modal.period}
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    {selectedClass?.name} · {DEFAULT_TIMES[modal.period].start}–{DEFAULT_TIMES[modal.period].end}
                                </p>
                            </div>
                            <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="px-6 py-5 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-2">Period type</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {SLOT_TYPES.map(t => (
                                        <button
                                            key={t}
                                            onClick={() => setFType(t)}
                                            className={`px-3 py-2 rounded-lg border text-xs font-semibold text-left transition-all ${fType === t
                                                ? SLOT_COLORS[t] + ' ring-2 ring-offset-1 ring-blue-400'
                                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                                                }`}
                                        >
                                            {SLOT_LABELS[t]}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {fType === 'class' && (
                                <>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-1">Subject *</label>
                                        <input
                                            type="text"
                                            value={fSubject}
                                            onChange={e => setFSubject(e.target.value)}
                                            placeholder="e.g. Mathematics"
                                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-1">Teacher</label>
                                        <select
                                            value={fTeacherId}
                                            onChange={e => setFTeacherId(e.target.value)}
                                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 bg-white"
                                        >
                                            <option value="">— No teacher assigned —</option>
                                            {teachers.map(t => (
                                                <option key={t.id} value={t.id}>{t.name} ({t.department})</option>
                                            ))}
                                        </select>
                                    </div>
                                </>
                            )}

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Start time</label>
                                    <input
                                        type="time"
                                        value={fStart}
                                        onChange={e => setFStart(e.target.value)}
                                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">End time</label>
                                    <input
                                        type="time"
                                        value={fEnd}
                                        onChange={e => setFEnd(e.target.value)}
                                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 font-mono"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">Note (optional)</label>
                                <input
                                    type="text"
                                    value={fNote}
                                    onChange={e => setFNote(e.target.value)}
                                    placeholder="e.g. Republic Day, substitute teacher..."
                                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
                                />
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between gap-3">
                            <div>
                                {modal.existing && (
                                    <button
                                        onClick={handleDelete}
                                        disabled={saving}
                                        className="flex items-center gap-1.5 text-red-600 hover:text-red-700 text-xs font-semibold px-3 py-2 rounded-lg hover:bg-red-50 transition-all"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        Clear period
                                    </button>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={closeModal}
                                    className="text-slate-600 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-slate-100 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-all disabled:opacity-50"
                                >
                                    {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    {modal.existing ? 'Update' : 'Save'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}