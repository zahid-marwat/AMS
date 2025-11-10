import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { adminService, type TeacherAccount } from '@/services/admin';
import type { ClassSummary } from '@/types';

type Period = 'daily' | 'weekly' | 'monthly' | 'yearly';

const resolveErrorMessage = (error: unknown, fallback: string) => {
  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as any).response;
    return response?.data?.message ?? response?.data?.error ?? fallback;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
};

export default function AdminTeachersPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<string | null>(null);
  const [editingTeacher, setEditingTeacher] = useState<TeacherAccount | null>(null);
  const [period, setPeriod] = useState<Period>('monthly');
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    classId: '',
  });
  const [editFormData, setEditFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    classId: '',
  });
  const queryClient = useQueryClient();

  const { data: teachers = [] } = useQuery<TeacherAccount[]>({
    queryKey: ['admin-teachers'],
    queryFn: adminService.listTeachers,
  });

  const { data: classes = [] } = useQuery<ClassSummary[]>({
    queryKey: ['admin-classes'],
    queryFn: adminService.listClasses,
  });

  const { data: teacherDetail } = useQuery({
    queryKey: ['teacher-detail', selectedTeacher, period],
    queryFn: () => selectedTeacher ? adminService.getTeacherDetail(selectedTeacher, { period }) : null,
    enabled: !!selectedTeacher,
  });

  const closeCreateModal = () => {
    setIsModalOpen(false);
    setFormData({ firstName: '', lastName: '', email: '', password: '', classId: '' });
    setShowCreatePassword(false);
  };

  const openCreateModal = () => {
    setFormData({ firstName: '', lastName: '', email: '', password: '', classId: '' });
    setIsModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingTeacher(null);
    setEditFormData({ firstName: '', lastName: '', email: '', password: '', classId: '' });
    setShowEditPassword(false);
  };

  const openEditModal = (teacher: TeacherAccount) => {
    setEditingTeacher(teacher);
    setEditFormData({
      firstName: teacher.firstName,
      lastName: teacher.lastName,
      email: teacher.email,
      password: '',
      classId: teacher.assignedClasses[0]?.id ?? '',
    });
    setIsEditModalOpen(true);
  };

  const createMutation = useMutation({
    mutationFn: adminService.createTeacher,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-teachers'] });
      queryClient.invalidateQueries({ queryKey: ['admin-overview'] });
      queryClient.invalidateQueries({ queryKey: ['admin-classes'] });
      closeCreateModal();
    },
    onError: (error) => {
      alert(resolveErrorMessage(error, 'Unable to create teacher.'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { firstName?: string; lastName?: string; email?: string; password?: string; classId?: string | null } }) =>
      adminService.updateTeacher(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-teachers'] });
      queryClient.invalidateQueries({ queryKey: ['admin-overview'] });
      queryClient.invalidateQueries({ queryKey: ['admin-classes'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-detail'] });
      closeEditModal();
    },
    onError: (error) => {
      alert(resolveErrorMessage(error, 'Unable to update teacher.'));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.firstName && formData.lastName && formData.email && formData.password) {
      createMutation.mutate({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        classId: formData.classId ? formData.classId : null,
      });
    }
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher) {
      return;
    }

    if (editFormData.firstName && editFormData.lastName && editFormData.email) {
      const payload: { firstName: string; lastName: string; email: string; password?: string; classId: string | null } = {
        firstName: editFormData.firstName,
        lastName: editFormData.lastName,
        email: editFormData.email,
        classId: editFormData.classId ? editFormData.classId : null,
      };

      if (editFormData.password.trim()) {
        payload.password = editFormData.password;
      }

      updateMutation.mutate({ id: editingTeacher.id, data: payload });
    }
  };

  const getPercentage = (value: number, total: number) => {
    return total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
  };

  return (
    <DashboardShell title="Teacher Management" role="admin">
      <Card
        title="Teachers"
        actions={<Button variant="primary" onClick={openCreateModal}>Add Teacher</Button>}
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Name
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Email
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Classes
                </th>
                <th className="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {teachers.map((teacher: TeacherAccount) => (
                <tr key={teacher.id} className="bg-white hover:bg-slate-50 transition-colors">
                  <td className="px-3 py-3 text-sm font-medium text-slate-900">
                    {teacher.firstName} {teacher.lastName}
                  </td>
                  <td className="px-3 py-3 text-sm text-slate-600">{teacher.email}</td>
                  <td className="px-3 py-3 text-sm text-slate-600">
                    {teacher.assignedClasses.map((klass) => klass.name).join(', ') || '—'}
                  </td>
                  <td className="px-3 py-3 text-sm text-center">
                    <div className="flex justify-center gap-2">
                      <Button
                        variant="secondary"
                        onClick={() => openEditModal(teacher)}
                        className="text-xs"
                      >
                        Edit
                      </Button>
                      <Button 
                        variant="secondary" 
                        onClick={() => setSelectedTeacher(teacher.id)}
                        className="text-xs"
                      >
                        View Summary
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {!teachers.length && (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-sm text-slate-500">
                    No teachers found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Teacher Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeCreateModal}
        title="Add New Teacher"
        footer={
          <>
            <Button variant="secondary" onClick={closeCreateModal}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              type="button"
              onClick={handleSubmit}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? 'Creating...' : 'Create Teacher'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              First Name
            </label>
            <input
              type="text"
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Last Name
            </label>
            <input
              type="text"
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email
            </label>
            <input
              type="email"
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showCreatePassword ? 'text' : 'password'}
                required
                minLength={6}
                placeholder="Minimum 6 characters"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 pr-10 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
              <button
                type="button"
                onClick={() => setShowCreatePassword((prev) => !prev)}
                className="absolute inset-y-0 right-2 flex items-center rounded px-1 text-slate-500 transition hover:text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                aria-label={showCreatePassword ? 'Hide password' : 'Show password'}
              >
                {showCreatePassword ? (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.53 3.53l16.94 16.94" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.88 9.88a3 3 0 104.24 4.24" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.23 6.23C3.8 7.85 2.25 10.09 2.25 12c0 0 3.75 7.5 9.75 7.5 1.12 0 2.18-.2 3.17-.56" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.77 17.77C20.2 16.15 21.75 13.91 21.75 12c0 0-3.75-7.5-9.75-7.5-1.12 0-2.18.2-3.17.56" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12c2.25-3.75 5.25-6 9.75-6s7.5 2.25 9.75 6c-2.25 3.75-5.25 6-9.75 6s-7.5-2.25-9.75-6z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Assign Class (optional)
            </label>
            <select
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
              value={formData.classId}
              onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
            >
              <option value="">Unassigned</option>
              {classes.map((klass) => {
                const teacherLabel = klass.teacherName ? ` – Assigned to ${klass.teacherName}` : ' – Unassigned';
                const gradeLabel = klass.gradeLevel && klass.gradeLevel !== klass.name ? ` (${klass.gradeLevel})` : '';
                return (
                  <option key={klass.id} value={klass.id}>
                    {klass.name}
                    {gradeLabel}
                    {teacherLabel}
                  </option>
                );
              })}
            </select>
            <p className="mt-1 text-xs text-slate-500">Selecting a class here will assign it to the new teacher.</p>
          </div>
        </form>
      </Modal>

      {/* Edit Teacher Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        title={editingTeacher ? `Edit Teacher • ${editingTeacher.firstName} ${editingTeacher.lastName}` : 'Edit Teacher'}
        footer={
          <>
            <Button variant="secondary" onClick={closeEditModal}>
              Cancel
            </Button>
            <Button
              variant="primary"
              type="button"
              onClick={handleEditSubmit}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">First Name</label>
              <input
                type="text"
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
                value={editFormData.firstName}
                onChange={(e) => setEditFormData({ ...editFormData, firstName: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
              <input
                type="text"
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
                value={editFormData.lastName}
                onChange={(e) => setEditFormData({ ...editFormData, lastName: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              type="email"
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
              value={editFormData.email}
              onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <div className="relative">
              <input
                type={showEditPassword ? 'text' : 'password'}
                minLength={6}
                placeholder="Leave blank to keep current password"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 pr-10 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
                value={editFormData.password}
                onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
              />
              <button
                type="button"
                onClick={() => setShowEditPassword((prev) => !prev)}
                className="absolute inset-y-0 right-2 flex items-center rounded px-1 text-slate-500 transition hover:text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                aria-label={showEditPassword ? 'Hide password' : 'Show password'}
              >
                {showEditPassword ? (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.53 3.53l16.94 16.94" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.88 9.88a3 3 0 104.24 4.24" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.23 6.23C3.8 7.85 2.25 10.09 2.25 12c0 0 3.75 7.5 9.75 7.5 1.12 0 2.18-.2 3.17-.56" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.77 17.77C20.2 16.15 21.75 13.91 21.75 12c0 0-3.75-7.5-9.75-7.5-1.12 0-2.18.2-3.17.56" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12c2.25-3.75 5.25-6 9.75-6s7.5 2.25 9.75 6c-2.25 3.75-5.25 6-9.75 6s-7.5-2.25-9.75-6z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>
            <p className="mt-1 text-xs text-slate-500">Passwords are stored securely and cannot be viewed. Enter a new password to reset.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Assign Class</label>
            <select
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
              value={editFormData.classId}
              onChange={(e) => setEditFormData({ ...editFormData, classId: e.target.value })}
            >
              <option value="">Unassigned</option>
              {classes.map((klass) => {
                const isAssignedToCurrent = editingTeacher?.assignedClasses?.some((assigned) => assigned.id === klass.id) ?? false;
                let assignmentLabel = ' – Unassigned';
                if (klass.teacherName) {
                  assignmentLabel = isAssignedToCurrent ? ' – Assigned to this teacher' : ` – Assigned to ${klass.teacherName}`;
                }
                const gradeLabel = klass.gradeLevel && klass.gradeLevel !== klass.name ? ` (${klass.gradeLevel})` : '';
                return (
                  <option key={klass.id} value={klass.id}>
                    {klass.name}
                    {gradeLabel}
                    {assignmentLabel}
                  </option>
                );
              })}
            </select>
            <p className="mt-1 text-xs text-slate-500">Changing this selection will immediately reassign the class.</p>
            {editingTeacher && (
              <p className="mt-1 text-xs text-slate-500">
                Current classes: {editingTeacher.assignedClasses.length ? editingTeacher.assignedClasses.map((klass) => klass.name).join(', ') : 'None'}
              </p>
            )}
          </div>
        </form>
      </Modal>

      {/* Teacher Detail Modal */}
      <Modal
        isOpen={!!selectedTeacher}
        onClose={() => setSelectedTeacher(null)}
        title={teacherDetail ? `${teacherDetail.teacher.firstName} ${teacherDetail.teacher.lastName} - Summary` : 'Teacher Summary'}
      >
        {teacherDetail && (
          <div className="space-y-6">
            {/* Period Selector */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Time Period
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(['daily', 'weekly', 'monthly', 'yearly'] as Period[]).map((p) => {
                  const periodLabels = {
                    daily: 'Today',
                    weekly: 'Last Week',
                    monthly: 'Last Month',
                    yearly: 'Last Year'
                  };
                  const periodDescriptions = {
                    daily: 'Present day',
                    weekly: 'Last 6 weekdays',
                    monthly: 'Last 30 weekdays',
                    yearly: 'Last 365 weekdays'
                  };
                  return (
                    <button
                      key={p}
                      onClick={() => setPeriod(p)}
                      className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                        period === p
                          ? 'bg-brand text-white border-brand'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                      }`}
                      title={periodDescriptions[p]}
                    >
                      {periodLabels[p]}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-slate-500 mt-2">
                {period === 'daily' && '📅 Showing present day only'}
                {period === 'weekly' && '📅 Showing last 6 weekdays (Mon-Fri)'}
                {period === 'monthly' && '📅 Showing last 30 weekdays (Mon-Fri)'}
                {period === 'yearly' && '📅 Showing last 365 weekdays (Mon-Fri)'}
              </p>
            </div>

            {/* Teacher Info */}
            <div className="bg-slate-50 rounded-lg p-4 space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase">Email</p>
                  <p className="text-sm text-slate-900">{teacherDetail.teacher.email}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase">Period</p>
                  <p className="text-sm text-slate-900">
                    {teacherDetail.startDate} to {teacherDetail.endDate}
                  </p>
                </div>
              </div>
            </div>

            {/* Attendance Summary */}
            <div>
              <h4 className="text-sm font-semibold text-slate-900 mb-3">Attendance Summary</h4>
              <div className="grid grid-cols-5 gap-3">
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <p className="text-xs font-medium text-slate-500 uppercase mb-1">Total</p>
                  <p className="text-2xl font-bold text-slate-900">{teacherDetail.attendance.total}</p>
                </div>
                <div className="bg-emerald-50 border-2 border-emerald-200 rounded-lg p-3">
                  <p className="text-xs font-medium text-emerald-700 uppercase mb-1">Present</p>
                  <p className="text-2xl font-bold text-emerald-700">{teacherDetail.attendance.present}</p>
                  <p className="text-xs text-emerald-600 mt-1">
                    {getPercentage(teacherDetail.attendance.present, teacherDetail.attendance.total)}%
                  </p>
                </div>
                <div className="bg-rose-50 border-2 border-rose-200 rounded-lg p-3">
                  <p className="text-xs font-medium text-rose-700 uppercase mb-1">Absent</p>
                  <p className="text-2xl font-bold text-rose-700">{teacherDetail.attendance.absent}</p>
                  <p className="text-xs text-rose-600 mt-1">
                    {getPercentage(teacherDetail.attendance.absent, teacherDetail.attendance.total)}%
                  </p>
                </div>
                <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-3">
                  <p className="text-xs font-medium text-amber-700 uppercase mb-1">Late</p>
                  <p className="text-2xl font-bold text-amber-700">{teacherDetail.attendance.late}</p>
                  <p className="text-xs text-amber-600 mt-1">
                    {getPercentage(teacherDetail.attendance.late, teacherDetail.attendance.total)}%
                  </p>
                </div>
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3">
                  <p className="text-xs font-medium text-blue-700 uppercase mb-1">Leave</p>
                  <p className="text-2xl font-bold text-blue-700">{teacherDetail.attendance.leave}</p>
                  <p className="text-xs text-blue-600 mt-1">
                    {getPercentage(teacherDetail.attendance.leave, teacherDetail.attendance.total)}%
                  </p>
                </div>
              </div>
            </div>

            {/* Assigned Classes */}
            <div>
              <h4 className="text-sm font-semibold text-slate-900 mb-3">Assigned Classes</h4>
              {teacherDetail.classes.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Class Name
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Grade
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Students
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {teacherDetail.classes.map((klass) => (
                        <tr key={klass.id}>
                          <td className="px-3 py-2 text-sm font-medium text-slate-900">
                            {klass.name}
                          </td>
                          <td className="px-3 py-2 text-sm text-slate-600">
                            {klass.gradeLevel}
                          </td>
                          <td className="px-3 py-2 text-sm text-slate-600 text-right">
                            {klass.studentCount}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-slate-500 italic">No classes assigned</p>
              )}
            </div>
          </div>
        )}
      </Modal>
    </DashboardShell>
  );
}
