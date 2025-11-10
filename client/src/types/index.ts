export type UserRole = 'ADMIN' | 'TEACHER' | 'admin' | 'teacher';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  assignedClassIds?: string[];
}

export interface ClassSummary {
  id: string;
  name: string;
  gradeLevel: string;
  teacherName?: string;
  studentCount: number;
  attendanceRate: number;
}

export interface StudentRecord {
  id: string;
  firstName: string;
  lastName: string;
  rollNumber: string;
  classId: string;
  monthlySummary?: StudentMonthlySummary;
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'leave';

export interface StudentMonthlySummary {
  present: number;
  absent: number;
  late: number;
  leave: number;
  total: number;
}

export interface StudentMonthlyAttendance {
  student: Pick<StudentRecord, 'id' | 'firstName' | 'lastName' | 'rollNumber' | 'classId'>;
  range: {
    startDate: string;
    endDate: string;
  };
  summary: StudentMonthlySummary;
  days: Array<{ date: string; status: AttendanceStatus | null }>;
}

export interface AttendanceEntry {
  id: string;
  studentId: string;
  classId: string;
  status: AttendanceStatus;
  date: string;
  recordedBy: string;
}

export interface AttendanceSummary {
  date: string;
  present: number;
  absent: number;
  late: number;
  leave: number;
}
