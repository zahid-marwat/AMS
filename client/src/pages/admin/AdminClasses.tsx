import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { adminService, type TeacherAccount } from '@/services/admin';
import type { ClassSummary } from '@/types';

const GRADE_LEVELS = [
  'Play Group',
  'Nursery',
  'Katchi',
  'KG',
  'Prep',
  'Grade 1',
  'Grade 2',
  'Grade 3',
  'Grade 4',
  'Grade 5',
  'Grade 6',
  'Grade 7',
  'Grade 8',
  'Grade 9',
  'Grade 10',
];

export default function AdminClassesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassSummary | null>(null);
  const [formData, setFormData] = useState({ name: '', gradeLevel: '', teacherId: '' });
  const queryClient = useQueryClient();

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

  const { data: classes = [] } = useQuery<ClassSummary[]>({
    queryKey: ['admin-classes'],
    queryFn: adminService.listClasses,
  });

  const { data: teachers = [] } = useQuery<TeacherAccount[]>({
    queryKey: ['admin-teachers'],
    queryFn: adminService.listTeachers,
  });

  const createMutation = useMutation({
    mutationFn: adminService.createClass,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-classes'] });
      queryClient.invalidateQueries({ queryKey: ['admin-overview'] });
      closeModal();
    },
    onError: (error) => {
      alert(resolveErrorMessage(error, 'Unable to create class.'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => adminService.updateClass(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-classes'] });
      queryClient.invalidateQueries({ queryKey: ['admin-overview'] });
      closeModal();
    },
    onError: (error) => {
      alert(resolveErrorMessage(error, 'Unable to update class.'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: adminService.deleteClass,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-classes'] });
      queryClient.invalidateQueries({ queryKey: ['admin-overview'] });
      queryClient.invalidateQueries({ queryKey: ['admin-students'] });
    },
  });

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingClass(null);
    setFormData({ name: '', gradeLevel: '', teacherId: '' });
  };

  const computeAvailableGrades = (excludeClassId?: string) => {
    const usedGrades = new Set(
      classes
        .filter((classItem) => classItem.id !== excludeClassId)
        .map((classItem) => classItem.gradeLevel),
    );

    return GRADE_LEVELS.filter((grade) => !usedGrades.has(grade));
  };

  const gradeOptions = useMemo(
    () => computeAvailableGrades(editingClass?.id),
    [classes, editingClass],
  );

  const openCreateModal = () => {
    setEditingClass(null);
    const availableGrades = computeAvailableGrades();

    if (!availableGrades.length) {
      alert('All grade levels already have a class assigned.');
      return;
    }

    const defaultGrade = availableGrades[0];
    setFormData({ name: defaultGrade, gradeLevel: defaultGrade, teacherId: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (classItem: ClassSummary) => {
    setEditingClass(classItem);
    setFormData({
      name: classItem.gradeLevel,
      gradeLevel: classItem.gradeLevel,
      teacherId: teachers.find(t => `${t.firstName} ${t.lastName}` === classItem.teacherName)?.id || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.gradeLevel) {
      const payload = {
        name: formData.name,
        gradeLevel: formData.gradeLevel,
        teacherId: formData.teacherId || undefined,
      };

      if (editingClass) {
        updateMutation.mutate({ id: editingClass.id, data: payload });
      } else {
        createMutation.mutate(payload);
      }
    }
  };

  const handleDelete = (classId: string, className: string) => {
    if (confirm(`Are you sure you want to delete "${className}"? This will also delete all students and attendance records in this class.`)) {
      deleteMutation.mutate(classId);
    }
  };

  const handleGradeChange = (gradeLevel: string) => {
    setFormData((prev) => ({ ...prev, gradeLevel, name: gradeLevel }));
  };

  return (
    <DashboardShell title="Class Management" role="admin">
      <Card
        title="Classes"
        actions={<Button variant="primary" onClick={openCreateModal}>Add Class</Button>}
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Name
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Grade
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Teacher
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Students
                </th>
                <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Attendance
                </th>
                <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {classes.map((classItem: ClassSummary) => (
                <tr key={classItem.id} className="bg-white">
                  <td className="px-3 py-3 text-sm font-medium text-slate-900">{classItem.name}</td>
                  <td className="px-3 py-3 text-sm text-slate-600">{classItem.gradeLevel}</td>
                  <td className="px-3 py-3 text-sm text-slate-600">
                    {classItem.teacherName ?? 'Unassigned'}
                  </td>
                  <td className="px-3 py-3 text-sm text-slate-600">{classItem.studentCount}</td>
                  <td className="px-3 py-3 text-right text-sm text-slate-600">
                    {Math.round(classItem.attendanceRate * 100)}%
                  </td>
                  <td className="px-3 py-3 text-right text-sm">
                    <button
                      onClick={() => openEditModal(classItem)}
                      className="text-blue-600 hover:text-blue-800 mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(classItem.id, classItem.name)}
                      className="text-rose-600 hover:text-rose-800"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {!classes?.length && (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-sm text-slate-500">
                    No classes have been created yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingClass ? 'Edit Class' : 'Add New Class'}
        footer={
          <>
            <Button variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending 
                ? 'Saving...' 
                : editingClass ? 'Update Class' : 'Create Class'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Class Name
            </label>
            <input
              type="text"
              required
              readOnly
              className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-600 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
              value={formData.name}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Grade Level
            </label>
            <select
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
              value={formData.gradeLevel}
              onChange={(e) => handleGradeChange(e.target.value)}
            >
              {gradeOptions.map((grade) => (
                <option key={grade} value={grade}>
                  {grade}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Teacher
            </label>
            <select
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
              value={formData.teacherId}
              onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
            >
              <option value="">Unassigned</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.firstName} {teacher.lastName}
                </option>
              ))}
            </select>
          </div>
        </form>
      </Modal>
    </DashboardShell>
  );
}
