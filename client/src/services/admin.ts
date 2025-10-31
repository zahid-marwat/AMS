import { api } from './api';
import type { AttendanceSummary, ClassSummary, StudentRecord } from '@/types';

type AdminOverviewResponse = {
  students: {
    total: number;
    delta: number;
  };
  attendance: {
    rate: number;
    history: Array<AttendanceSummary & { present: number; absent: number }>;
  };
  teachers: {
    coverage: string;
  };
  classes: {
    distribution: Array<{ name: string; students: number; attendance: number }>;
  };
};

export type TeacherAccount = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  assignedClasses: ClassSummary[];
};

export const adminService = {
  async fetchOverview() {
    console.log('Fetching admin overview...');
    try {
      const { data } = await api.get<AdminOverviewResponse>('/admin/overview');
      console.log('Admin overview received:', data);
      return data;
    } catch (error) {
      console.error('Error fetching admin overview:', error);
      throw error;
    }
  },

  async listClasses() {
    const { data } = await api.get<ClassSummary[]>('/admin/classes');
    return data;
  },

  async listStudents() {
    const { data } = await api.get<StudentRecord[]>('/admin/students');
    return data;
  },

  async listTeachers() {
    const { data } = await api.get<TeacherAccount[]>('/admin/teachers');
    return data;
  },

  async createClass(payload: { name: string; gradeLevel: string; teacherId?: string }) {
    const { data } = await api.post<ClassSummary>('/admin/classes', payload);
    return data;
  },

  async updateClass(classId: string, payload: { name?: string; gradeLevel?: string; teacherId?: string | null }) {
    const { data } = await api.put<ClassSummary>(`/admin/classes/${classId}`, payload);
    return data;
  },

  async deleteClass(classId: string) {
    await api.delete(`/admin/classes/${classId}`);
  },

  async createStudent(payload: { firstName: string; lastName: string; classId: string }) {
    const { data } = await api.post<StudentRecord>('/admin/students', payload);
    return data;
  },

  async updateStudent(studentId: string, payload: { firstName?: string; lastName?: string; classId?: string }) {
    const { data } = await api.put<StudentRecord>(`/admin/students/${studentId}`, payload);
    return data;
  },

  async createTeacher(payload: { firstName: string; lastName: string; email: string; password: string }) {
    const { data } = await api.post<{ id: string; firstName: string; lastName: string; email: string; role: string }>('/admin/teachers', payload);
    return data;
  },

  async deleteStudent(id: string) {
    await api.delete(`/admin/students/${id}`);
  },

  async upsertStudent(payload: { id?: string } & Omit<StudentRecord, 'id'>) {
    const { data } = await api.post<StudentRecord>('/admin/students', payload);
    return data;
  },

  async removeStudent(id: string) {
    await api.delete(`/admin/students/${id}`);
  },

  async getAttendanceForClass(classId: string, params: { startDate?: string; endDate?: string }) {
    const { data } = await api.get<AttendanceSummary[]>(`/admin/classes/${classId}/attendance`, {
      params,
    });
    return data;
  },

  async getAttendanceSummary(classId: string, params: { period?: 'daily' | 'weekly' | 'monthly' | 'yearly'; startDate?: string; endDate?: string }) {
    const { data } = await api.get<{
      period: string;
      startDate: string;
      endDate: string;
      summary: {
        total: number;
        present: number;
        absent: number;
        late: number;
        leave: number;
      };
      students: Array<{
        id: string;
        name: string;
        present: number;
        absent: number;
        late: number;
        leave: number;
        total: number;
      }>;
      records: Array<{
        id: string;
        studentId: string;
        studentName: string;
        className: string;
        status: string;
        date: string;
      }>;
    }>(`/admin/classes/${classId}/attendance-summary`, { params });
    return data;
  },

  async getTeacherDetail(teacherId: string, params: { period?: 'daily' | 'weekly' | 'monthly' | 'yearly'; startDate?: string; endDate?: string }) {
    const { data } = await api.get<{
      teacher: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
      };
      classes: Array<{
        id: string;
        name: string;
        gradeLevel: string;
        studentCount: number;
      }>;
      attendance: {
        total: number;
        present: number;
        absent: number;
        late: number;
        leave: number;
      };
      period: string;
      startDate: string;
      endDate: string;
    }>(`/admin/teachers/${teacherId}/detail`, { params });
    return data;
  },

  async getSchoolAttendanceSummary(params: { period?: 'daily' | 'weekly' | 'monthly' | 'yearly'; startDate?: string; endDate?: string }) {
    const { data } = await api.get<{
      period: string;
      startDate: string;
      endDate: string;
      summary: {
        total: number;
        present: number;
        absent: number;
        late: number;
        leave: number;
      };
      classes: Array<{
        id: string;
        name: string;
        present: number;
        absent: number;
        late: number;
        leave: number;
        total: number;
      }>;
      records: Array<{
        id: string;
        studentId: string;
        studentName: string;
        className: string;
        status: string;
        date: string;
      }>;
    }>('/admin/school/attendance-summary', { params });
    return data;
  },

  async getStudentDailyAttendance(params: { classId?: string; period?: 'daily' | 'weekly' | 'monthly' | 'yearly'; startDate?: string; endDate?: string }) {
    const { data } = await api.get<{
      period: string;
      startDate: string;
      endDate: string;
      students: Array<{
        id: string;
        name: string;
        className: string;
        classId: string;
        dailyRecords: Array<{
          date: string;
          status: string;
        }>;
        summary: {
          present: number;
          absent: number;
          late: number;
          leave: number;
          total: number;
        };
      }>;
    }>('/admin/students/daily-attendance', { params });
    return data;
  },
};