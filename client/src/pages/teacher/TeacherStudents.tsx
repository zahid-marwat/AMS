import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { Card } from '@/components/ui/Card';
import { teacherService } from '@/services/teacher';
import type { StudentMonthlyAttendance, StudentRecord } from '@/types';
import { useAuth } from '@/hooks/useAuth';

export default function TeacherStudentsPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const assignedClassId = user?.assignedClassIds?.[0];
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(() => format(new Date(), 'yyyy-MM'));
  const monthParts = selectedMonth.split('-');
  const monthValue = Number.parseInt(monthParts[1] ?? '', 10);
  const yearValue = Number.parseInt(monthParts[0] ?? '', 10);
  const { data: students = [] } = useQuery<StudentRecord[]>({
    queryKey: ['teacher-students', assignedClassId, monthValue, yearValue],
    queryFn: () =>
      teacherService.listStudents(assignedClassId ?? '', {
        month: Number.isFinite(monthValue) ? monthValue : undefined,
        year: Number.isFinite(yearValue) ? yearValue : undefined,
      }),
    enabled: Boolean(assignedClassId),
  });

  useEffect(() => {
    if (!students.length) {
      setSelectedStudentId(null);
      return;
    }

    if (!selectedStudentId || !students.some((student) => student.id === selectedStudentId)) {
      setSelectedStudentId(students[0]?.id ?? null);
    }
  }, [students, selectedStudentId]);

  const { data: monthlyAttendance } = useQuery<StudentMonthlyAttendance | undefined>({
    queryKey: ['teacher-student-monthly', selectedStudentId, monthValue, yearValue],
    queryFn: () =>
      selectedStudentId
        ? teacherService.getStudentMonthlyAttendance(selectedStudentId, {
            month: Number.isFinite(monthValue) ? monthValue : undefined,
            year: Number.isFinite(yearValue) ? yearValue : undefined,
          })
        : Promise.resolve(undefined),
    enabled: Boolean(selectedStudentId),
  });

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return students.filter((student: StudentRecord) =>
      `${student.firstName} ${student.lastName}`.toLowerCase().includes(term)
      || student.rollNumber.toLowerCase().includes(term),
    );
  }, [students, search]);

  const getStatusLabel = (status: StudentMonthlyAttendance['days'][number]['status']) => {
    switch (status) {
      case 'present':
        return 'Present';
      case 'absent':
        return 'Absent';
      case 'late':
        return 'Late';
      case 'leave':
        return 'Leave';
      default:
        return '—';
    }
  };

  return (
    <DashboardShell title="Students" role="teacher">
      <Card title="Class Roster">
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <input
            type="search"
            placeholder="Search students"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
            value={search}
            onChange={(event: ChangeEvent<HTMLInputElement>) => setSearch(event.target.value)}
          />
          <label className="flex w-full flex-col text-sm text-slate-600 sm:w-auto">
            <span className="mb-1 font-medium text-slate-700">Month</span>
            <input
              type="month"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
              value={selectedMonth}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setSelectedMonth(event.target.value || format(new Date(), 'yyyy-MM'))
              }
            />
          </label>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Roll #
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Name
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Present
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Absent
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Late
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Leave
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filtered.map((student: StudentRecord) => (
                <tr
                  key={student.id}
                  className={`cursor-pointer bg-white transition hover:bg-slate-50 ${
                    selectedStudentId === student.id ? 'bg-brand/10' : ''
                  }`}
                  onClick={() => setSelectedStudentId(student.id)}
                >
                  <td className="px-3 py-3 text-sm font-semibold text-slate-900">
                    {student.rollNumber}
                  </td>
                  <td className="px-3 py-3 text-sm font-medium text-slate-900">
                    {student.firstName} {student.lastName}
                  </td>
                  <td className="px-3 py-3 text-sm text-slate-700">
                    {student.monthlySummary?.present ?? 0}
                  </td>
                  <td className="px-3 py-3 text-sm text-slate-700">
                    {student.monthlySummary?.absent ?? 0}
                  </td>
                  <td className="px-3 py-3 text-sm text-slate-700">
                    {student.monthlySummary?.late ?? 0}
                  </td>
                  <td className="px-3 py-3 text-sm text-slate-700">
                    {student.monthlySummary?.leave ?? 0}
                  </td>
                </tr>
              ))}
              {!filtered.length && (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-sm text-slate-500">No students found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="Attendance Details">
        {monthlyAttendance ? (
          <div className="space-y-6">
            <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  {format(parseISO(monthlyAttendance.range.startDate), 'LLLL yyyy')}
                </p>
                <h3 className="text-lg font-semibold text-slate-900">
                  {monthlyAttendance.student.firstName} {monthlyAttendance.student.lastName}
                </h3>
                <p className="text-xs text-slate-500">Roll #{monthlyAttendance.student.rollNumber}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm text-slate-700 sm:grid-cols-4">
                <div className="rounded-lg bg-slate-50 px-3 py-2">
                  <p className="text-xs uppercase text-slate-500">Present</p>
                  <p className="text-lg font-semibold">{monthlyAttendance.summary.present}</p>
                </div>
                <div className="rounded-lg bg-slate-50 px-3 py-2">
                  <p className="text-xs uppercase text-slate-500">Absent</p>
                  <p className="text-lg font-semibold">{monthlyAttendance.summary.absent}</p>
                </div>
                <div className="rounded-lg bg-slate-50 px-3 py-2">
                  <p className="text-xs uppercase text-slate-500">Late</p>
                  <p className="text-lg font-semibold">{monthlyAttendance.summary.late}</p>
                </div>
                <div className="rounded-lg bg-slate-50 px-3 py-2">
                  <p className="text-xs uppercase text-slate-500">Leave</p>
                  <p className="text-lg font-semibold">{monthlyAttendance.summary.leave}</p>
                </div>
              </div>
            </header>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Date
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {monthlyAttendance.days.map((day: StudentMonthlyAttendance['days'][number]) => (
                    <tr key={day.date} className="bg-white">
                      <td className="px-3 py-2 text-sm text-slate-700">
                        {format(parseISO(day.date), 'LLL d, yyyy')}
                      </td>
                      <td className="px-3 py-2 text-sm font-medium text-slate-900">
                        {getStatusLabel(day.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            Select a student above to see their attendance history for the selected month.
          </p>
        )}
      </Card>
    </DashboardShell>
  );
}
