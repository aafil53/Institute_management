/**
 * Hudur Attendance System Group Types
 */

export type AttendanceStatus = 'Present' | 'Absent' | 'Late' | 'Excused';

export interface Student {
  id: string;
  name: string;
  rollNo: string;
  classId: string; // references ClassGroup
  email: string;
  contact?: string;
  isActive: boolean;
}

export interface Teacher {
  id: string;
  name: string;
  employeeId: string;
  email: string;
  department: string;
  contact?: string;
}

export interface ClassGroup {
  id: string;
  name: string; // e.g., 'Grade 10-A', 'Class 12-B CS'
  department: string;
}

export interface TimetableEntry {
  id: string;
  classId: string;
  courseName: string; // e.g., 'Mathematics', 'Computer Science'
  teacherId: string;
  dayOfWeek: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  startTime: string; // 'HH:MM' format, e.g. '09:00'
  endTime: string; // 'HH:MM' format, e.g. '10:00'
  room: string; // e.g., 'Room 102', 'Lab 3'
  status?: 'Active' | 'Rescheduled' | 'Cancelled' | 'Substitute' | 'Holiday';
  substituteTeacherId?: string;
  notes?: string;
}

export interface StudentAttendanceRecord {
  studentId: string;
  studentName: string;
  status: AttendanceStatus;
  note?: string;
}

export interface AttendanceLog {
  id: string;
  date: string; // 'YYYY-MM-DD'
  classId: string;
  timetableId: string; // references TimetableEntry
  courseName: string;
  teacherId: string;
  markedAt: string; // ISO string
  records: StudentAttendanceRecord[];
}
