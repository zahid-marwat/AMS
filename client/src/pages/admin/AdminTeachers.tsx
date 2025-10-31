import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { adminService, type TeacherAccount } from '@/services/admin';

type Period = 'daily' | 'weekly' | 'monthly' | 'yearly';

export default function AdminTeachersPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>('monthly');
  const [formData, setFormData] = useState({ 
    firstName: '', 
    lastName: '', 
    email: '', 
    password: '' 
  });
  const queryClient = useQueryClient();

  const { data: teachers = [] } = useQuery<TeacherAccount[]>({
    queryKey: ['admin-teachers'],
    queryFn: adminService.listTeachers,
  });

  const { data: teacherDetail } = useQuery({
    queryKey: ['teacher-detail', selectedTeacher, period],
    queryFn: () => selectedTeacher ? adminService.getTeacherDetail(selectedTeacher, { period }) : null,
    enabled: !!selectedTeacher,
  });

  const createMutation = useMutation({
    mutationFn: adminService.createTeacher,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-teachers'] });
      queryClient.invalidateQueries({ queryKey: ['admin-overview'] });
      setIsModalOpen(false);
      setFormData({ firstName: '', lastName: '', email: '', password: '' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.firstName && formData.lastName && formData.email && formData.password) {
      createMutation.mutate(formData);
    }
  };

  const getPercentage = (value: number, total: number) => {
    return total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
  };

  return (
    <DashboardShell title="Teacher Management" role="admin">
      <Card
        title="Teachers"
        actions={<Button variant="primary" onClick={() => setIsModalOpen(true)}>Add Teacher</Button>}
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
                    <Button 
                      variant="secondary" 
                      onClick={() => setSelectedTeacher(teacher.id)}
                      className="text-xs"
                    >
                      View Summary
                    </Button>
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
        onClose={() => setIsModalOpen(false)}
        title="Add New Teacher"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
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
            <input
              type="password"
              required
              minLength={6}
              placeholder="Minimum 6 characters"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
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
