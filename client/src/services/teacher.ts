import { api } from './api';
import type { AttendanceEntry, AttendanceStatus, AttendanceSummary, StudentRecord } from '@/types';

export type TeacherDashboardResponse = {
  classId: string;
  className: string;
  date: string;
  summary: AttendanceSummary;
  submissions: AttendanceEntry[];
};

export const teacherService = {
  async getDashboard() {
    const { data } = await api.get<TeacherDashboardResponse>('/teacher/dashboard');
    return data;
  },

  async listStudents(classId: string) {
    const { data } = await api.get<StudentRecord[]>(`/teacher/classes/${classId}/students`);
    return data;
  },

  async submitAttendance(classId: string, payload: Array<{ studentId: string; status: AttendanceStatus }>) {
    const { data } = await api.post(`/teacher/classes/${classId}/attendance`, { submissions: payload });
    return data;
  },

  async getHistory(params: { startDate?: string; endDate?: string }) {
    const { data } = await api.get<AttendanceSummary[]>('/teacher/attendance', { params });
    return data;
  },
};
