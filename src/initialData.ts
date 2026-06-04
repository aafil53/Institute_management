import { Student, Teacher, ClassGroup, TimetableEntry, AttendanceLog } from './types';

export const INITIAL_CLASSES: ClassGroup[] = [
  { id: 'class-10s', name: 'Grade 10-Science', department: 'Science' },
  { id: 'class-11cs', name: 'Grade 11-Computer Science', department: 'Technology' },
  { id: 'class-12c', name: 'Grade 12-Commerce', department: 'Commerce' },
  { id: 'class-9h', name: 'Grade 9-Humanities', department: 'Humanities' }
];

export const INITIAL_TEACHERS: Teacher[] = [
  { id: 'teach-sara', name: 'Sarah Connor', employeeId: 'EMP-4039', email: 's.connor@institute.edu', department: 'Technology', contact: '+1 (555) 123-4567' },
  { id: 'teach-john', name: 'John Doe', employeeId: 'EMP-1102', email: 'j.doe@institute.edu', department: 'Science', contact: '+1 (555) 234-5678' },
  { id: 'teach-emily', name: 'Emily Watson', employeeId: 'EMP-5524', email: 'e.watson@institute.edu', department: 'Science', contact: '+1 (555) 345-6789' },
  { id: 'teach-marcus', name: 'Marcus Aurelius', employeeId: 'EMP-0120', email: 'm.aurelius@institute.edu', department: 'Humanities', contact: '+1 (555) 456-7890' },
  { id: 'teach-alan', name: 'Alan Turing', employeeId: 'EMP-1912', email: 'a.turing@institute.edu', department: 'Technology', contact: '+1 (555) 567-8901' }
];

export const INITIAL_STUDENTS: Student[] = [
  // Grade 10-Science
  { id: 'stud-101', name: 'Alice Smith', rollNo: '10S-01', classId: 'class-10s', email: 'alice.smith@stud.edu', isActive: true },
  { id: 'stud-102', name: 'Bob Johnson', rollNo: '10S-02', classId: 'class-10s', email: 'bob.johnson@stud.edu', isActive: true },
  { id: 'stud-103', name: 'Charlie Brown', rollNo: '10S-03', classId: 'class-10s', email: 'charlie.brown@stud.edu', isActive: true },
  { id: 'stud-104', name: 'Daniel Craig', rollNo: '10S-04', classId: 'class-10s', email: 'daniel.craig@stud.edu', isActive: true },
  { id: 'stud-105', name: 'Emma Watson', rollNo: '10S-05', classId: 'class-10s', email: 'emma.watson@stud.edu', isActive: true },
  { id: 'stud-106', name: 'Fiona Gallagher', rollNo: '10S-06', classId: 'class-10s', email: 'fiona.g@stud.edu', isActive: true },
  
  // Grade 11-Computer Science
  { id: 'stud-201', name: 'Grace Hopper', rollNo: '11CS-01', classId: 'class-11cs', email: 'g.hopper@stud.edu', isActive: true },
  { id: 'stud-202', name: 'Henry Cavill', rollNo: '11CS-02', classId: 'class-11cs', email: 'henry.cavill@stud.edu', isActive: true },
  { id: 'stud-203', name: 'Ian McKellen', rollNo: '11CS-03', classId: 'class-11cs', email: 'ian.m@stud.edu', isActive: true },
  { id: 'stud-204', name: 'Julia Roberts', rollNo: '11CS-04', classId: 'class-11cs', email: 'julia.r@stud.edu', isActive: true },
  { id: 'stud-205', name: 'Kevin Hart', rollNo: '11CS-05', classId: 'class-11cs', email: 'kevin.h@stud.edu', isActive: true },
  { id: 'stud-206', name: 'Linus Torvalds', rollNo: '11CS-06', classId: 'class-11cs', email: 'linus.t@stud.edu', isActive: true },
  { id: 'stud-207', name: 'Margaret Hamilton', rollNo: '11CS-07', classId: 'class-11cs', email: 'margaret.h@stud.edu', isActive: true },
  
  // Grade 12-Commerce
  { id: 'stud-301', name: 'Nancy Wheeler', rollNo: '12C-01', classId: 'class-12c', email: 'nancy.w@stud.edu', isActive: true },
  { id: 'stud-302', name: 'Oliver Twist', rollNo: '12C-02', classId: 'class-12c', email: 'oliver.t@stud.edu', isActive: true },
  { id: 'stud-303', name: 'Peter Parker', rollNo: '12C-03', classId: 'class-12c', email: 'peter.p@stud.edu', isActive: true },
  { id: 'stud-304', name: 'Quentin Tarantino', rollNo: '12C-04', classId: 'class-12c', email: 'quentin.t@stud.edu', isActive: true },
  { id: 'stud-305', name: 'Rachel Green', rollNo: '12C-05', classId: 'class-12c', email: 'rachel.g@stud.edu', isActive: true },

  // Grade 9-Humanities
  { id: 'stud-401', name: 'Steve Rogers', rollNo: '9H-01', classId: 'class-9h', email: 'steve.rogers@stud.edu', isActive: true },
  { id: 'stud-402', name: 'Tony Stark', rollNo: '9H-02', classId: 'class-9h', email: 'tony.stark@stud.edu', isActive: true },
  { id: 'stud-403', name: 'Wanda Maximoff', rollNo: '9H-03', classId: 'class-9h', email: 'wanda.m@stud.edu', isActive: true }
];

export const INITIAL_TIMETABLE: TimetableEntry[] = [
  // Monday
  { id: 't-mon-1', classId: 'class-10s', courseName: 'Advanced Physics', teacherId: 'teach-emily', dayOfWeek: 'Monday', startTime: '08:30', endTime: '09:30', room: 'Physics Lab 1' },
  { id: 't-mon-2', classId: 'class-11cs', courseName: 'Data Structures', teacherId: 'teach-sara', dayOfWeek: 'Monday', startTime: '09:45', endTime: '11:00', room: 'IT Lab 2' },
  { id: 't-mon-3', classId: 'class-12c', courseName: 'Macroeconomics', teacherId: 'teach-john', dayOfWeek: 'Monday', startTime: '11:15', endTime: '12:30', room: 'Room 204' },
  
  // Tuesday
  { id: 't-tue-1', classId: 'class-11cs', courseName: 'Algorithms', teacherId: 'teach-alan', dayOfWeek: 'Tuesday', startTime: '08:30', endTime: '09:30', room: 'IT Lab 2' },
  { id: 't-tue-2', classId: 'class-10s', courseName: 'Calculus I', teacherId: 'teach-john', dayOfWeek: 'Tuesday', startTime: '10:00', endTime: '11:15', room: 'Room 302' },
  { id: 't-tue-3', classId: 'class-9h', courseName: 'Roman Philosophy', teacherId: 'teach-marcus', dayOfWeek: 'Tuesday', startTime: '11:45', endTime: '13:00', room: 'Seminar Hall' },
  
  // Wednesday
  { id: 't-wed-1', classId: 'class-11cs', courseName: 'Database Systems', teacherId: 'teach-sara', dayOfWeek: 'Wednesday', startTime: '08:30', endTime: '09:45', room: 'IT Lab 2' },
  { id: 't-wed-2', classId: 'class-10s', courseName: 'Applied Chemistry', teacherId: 'teach-emily', dayOfWeek: 'Wednesday', startTime: '10:00', endTime: '11:15', room: 'Chemistry Lab' },
  { id: 't-wed-3', classId: 'class-12c', courseName: 'Accountancy III', teacherId: 'teach-john', dayOfWeek: 'Wednesday', startTime: '12:30', endTime: '13:45', room: 'Room 204' },
  
  // Thursday
  { id: 't-thu-1', classId: 'class-9h', courseName: 'Ethics & Governance', teacherId: 'teach-marcus', dayOfWeek: 'Thursday', startTime: '09:00', endTime: '10:15', room: 'Room 101' },
  { id: 't-thu-2', classId: 'class-11cs', courseName: 'Web Programming', teacherId: 'teach-alan', dayOfWeek: 'Thursday', startTime: '10:30', endTime: '12:00', room: 'IT Lab 2' },
  { id: 't-thu-3', classId: 'class-10s', courseName: 'Modern Literature', teacherId: 'teach-marcus', dayOfWeek: 'Thursday', startTime: '12:30', endTime: '13:45', room: 'Room 302' },
  
  // Friday
  { id: 't-fri-1', classId: 'class-11cs', courseName: 'Systems Architecture', teacherId: 'teach-alan', dayOfWeek: 'Friday', startTime: '08:30', endTime: '10:00', room: 'IT Lab 2' },
  { id: 't-fri-2', classId: 'class-12c', courseName: 'Business Law', teacherId: 'teach-john', dayOfWeek: 'Friday', startTime: '10:15', endTime: '11:30', room: 'Room 204' },
  { id: 't-fri-3', classId: 'class-10s', courseName: 'Trigonometry', teacherId: 'teach-emily', dayOfWeek: 'Friday', startTime: '11:45', endTime: '13:00', room: 'Room 302' },
  { id: 't-fri-4', classId: 'class-9h', courseName: 'Ancient History', teacherId: 'teach-marcus', dayOfWeek: 'Friday', startTime: '13:30', endTime: '14:45', room: 'Room 101' }
];

// Generate last 7 days of dates helper
export function getPastDates(numDays = 7): string[] {
  const dates: string[] = [];
  const today = new Date();
  for (let i = numDays; i >= 1; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    // skip Sundays
    if (d.getDay() !== 0) {
      dates.push(d.toISOString().split('T')[0]);
    }
  }
  return dates;
}

// Generate realistic mock history for those dates based on timetables
export function generateMockLogs(): AttendanceLog[] {
  const logs: AttendanceLog[] = [];
  const pastDates = getPastDates(10); // get last 10 days of dates

  // Days of the week mapping index to string
  const dayNames: Record<number, string> = {
    1: 'Monday',
    2: 'Tuesday',
    3: 'Wednesday',
    4: 'Thursday',
    5: 'Friday',
    6: 'Saturday'
  };

  let logIdCounter = 1000;

  pastDates.forEach(dateStr => {
    const d = new Date(dateStr);
    const dayName = dayNames[d.getDay()];
    if (!dayName) return;

    // Find timetable entries for that day
    const entries = INITIAL_TIMETABLE.filter(e => e.dayOfWeek === dayName);

    entries.forEach(entry => {
      // Find students in this class
      const classStudents = INITIAL_STUDENTS.filter(s => s.classId === entry.classId);
      if (classStudents.length === 0) return;

      const records = classStudents.map(student => {
        // Generate random realistic attendance
        // 80% Present, 10% Late, 7% Absent, 3% Excused
        const rand = Math.random();
        let status: 'Present' | 'Absent' | 'Late' | 'Excused' = 'Present';
        let note = '';

        if (rand < 0.08) {
          status = 'Absent';
          const reasons = ['Sick leave', 'Family emergency', 'Doctor appointment', 'Missed bus'];
          note = reasons[Math.floor(Math.random() * reasons.length)];
        } else if (rand < 0.16) {
          status = 'Late';
          note = 'Delayed by traffic - 10 mins';
        } else if (rand < 0.20) {
          status = 'Excused';
          note = 'Pre-approved leave (sports tournament)';
        }

        return {
          studentId: student.id,
          studentName: student.name,
          status,
          note
        };
      });

      // Simple time offset for markedAt
      const markedTime = new Date(`${dateStr}T${entry.startTime}:00`);
      markedTime.setMinutes(markedTime.getMinutes() + Math.floor(Math.random() * 15) + 5);

      logs.push({
        id: `log-${logIdCounter++}`,
        date: dateStr,
        classId: entry.classId,
        timetableId: entry.id,
        courseName: entry.courseName,
        teacherId: entry.teacherId,
        markedAt: markedTime.toISOString(),
        records
      });
    });
  });

  return logs;
}

export const INITIAL_ATTENDANCE_LOGS: AttendanceLog[] = generateMockLogs();
