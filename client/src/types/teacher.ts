import type { AttendanceStatus } from './index';

type AttendanceStage = 'submitted' | 'draft' | 'pending' | 'no-class';

type DashboardSubmission = {
  studentId: string;
  studentName: string;
  rollNumber: string;
  status: AttendanceStatus;
  hasRecord: boolean;
  isDraft: boolean;
  lastUpdated: string | null;
};

type DashboardSummary = Record<AttendanceStatus, number>;

type DashboardNotification = {
  id: string;
  message: string;
  type: 'info' | 'warning';
  date: string;
};

type QuickActions = {
  lastSubmittedAt: string | null;
  nextClass: string | null;
  pendingStudents: number;
  draftCount: number;
};

export type TeacherDashboardResponse = {
  date: string;
  classId: string | null;
  className: string | null;
  totalStudents: number;
  attendanceStatus: AttendanceStage;
  summary: DashboardSummary;
  submissions: DashboardSubmission[];
  quickActions: QuickActions;
  notifications: DashboardNotification[];
};

export type TeacherDashboardSubmission = DashboardSubmission;
export type TeacherDashboardNotification = DashboardNotification;
