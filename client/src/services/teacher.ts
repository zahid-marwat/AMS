import { api } from './api';
import type { AttendanceStatus, StudentRecord } from '@/types';
import type { TeacherDashboardResponse } from '@/types/teacher';

type SubmissionPayload = Array<{ studentId: string; status: AttendanceStatus }>;

export type TeacherAttendanceHistory = {
  range: {
    startDate: string;
    endDate: string;
  };
  summaries: Array<{
    date: string;
    present: number;
    absent: number;
    late: number;
    leave: number;
    editable: boolean;
  }>;
  totals: {
    present: number;
    absent: number;
    late: number;
    leave: number;
  };
};

export const teacherService = {
  async getDashboard() {
    const { data } = await api.get<TeacherDashboardResponse>('/teacher/dashboard');
    return data;
  },

  async saveDraft(classId: string, submissions: SubmissionPayload) {
    await api.post('/teacher/attendance/draft', {
      classId,
      submissions,
    });
  },

  async listStudents(classId: string) {
    const { data } = await api.get<StudentRecord[]>(`/teacher/classes/${classId}/students`);
    return data;
  },

  async submitAttendance(classId: string, submissions: SubmissionPayload) {
    await api.post('/teacher/attendance/submit', {
      classId,
      submissions,
    });
  },

  async getHistory(params: { startDate?: string; endDate?: string }) {
    const { data } = await api.get<TeacherAttendanceHistory>('/teacher/attendance/history', {
      params,
    });
    return data;
  },

  async getNotifications() {
    const { data } = await api.get<TeacherDashboardResponse['notifications']>('/teacher/notifications');
    return data;
  },

  async getProfile() {
    const { data } = await api.get('/teacher/profile');
    return data;
  },
};
