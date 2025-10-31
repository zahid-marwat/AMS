import { useMemo, useState, type ChangeEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { Card } from '@/components/ui/Card';
import { teacherService } from '@/services/teacher';
import type { StudentRecord } from '@/types';
import { useAuth } from '@/hooks/useAuth';

export default function TeacherStudentsPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const assignedClassId = user?.assignedClassIds?.[0];
  const { data: students = [] } = useQuery<StudentRecord[]>({
    queryKey: ['teacher-students', assignedClassId],
    queryFn: () => teacherService.listStudents(assignedClassId ?? ''),
    enabled: Boolean(assignedClassId),
  });

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return students.filter((student: StudentRecord) =>
      `${student.firstName} ${student.lastName}`.toLowerCase().includes(term),
    );
  }, [students, search]);

  return (
    <DashboardShell title="Students" role="teacher">
      <Card title="Class Roster">
        <div className="mb-4">
          <input
            type="search"
            placeholder="Search students"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
            value={search}
            onChange={(event: ChangeEvent<HTMLInputElement>) => setSearch(event.target.value)}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Name
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filtered.map((student: StudentRecord) => (
                <tr key={student.id} className="bg-white">
                  <td className="px-3 py-3 text-sm font-medium text-slate-900">
                    {student.firstName} {student.lastName}
                  </td>
                </tr>
              ))}
              {!filtered.length && (
                <tr>
                  <td className="px-3 py-6 text-center text-sm text-slate-500">No students found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </DashboardShell>
  );
}
