import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { teacherService, type TeacherDashboardResponse } from '@/services/teacher';
import type { AttendanceEntry, AttendanceStatus } from '@/types';

const attendanceStatuses: Array<{ label: string; value: AttendanceStatus }> = [
  { label: 'Present', value: 'present' },
  { label: 'Absent', value: 'absent' },
  { label: 'Late', value: 'late' },
  { label: 'On Leave', value: 'leave' },
];

type AttendanceDraft = Record<string, AttendanceStatus>;

export default function TeacherDashboardPage() {
  const [draft, setDraft] = useState<AttendanceDraft>({});

  const { data: dashboard } = useQuery<TeacherDashboardResponse>({
    queryKey: ['teacher-dashboard'],
    queryFn: teacherService.getDashboard,
  });

  const students: AttendanceEntry[] = dashboard?.submissions ?? [];

  const handleSetStatus = (studentId: string, status: AttendanceStatus) => {
    setDraft((prev: AttendanceDraft) => ({ ...prev, [studentId]: status }));
  };

  const handleSubmit = async () => {
    if (!dashboard) return;
    const payload = students.map((entry: AttendanceEntry) => ({
      studentId: entry.studentId,
      status: draft[entry.studentId] ?? entry.status,
    }));
    await teacherService.submitAttendance(dashboard.classId, payload);
  };

  return (
    <DashboardShell title="Daily Attendance" role="teacher">
      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Class Overview" className="lg:col-span-1">
          <p className="text-sm text-slate-500">Class</p>
          <p className="text-lg font-semibold text-slate-900">{dashboard?.className ?? '—'}</p>
          <p className="mt-4 text-sm text-slate-500">Date</p>
          <p className="text-lg font-semibold text-slate-900">{dashboard?.date ?? '—'}</p>
          {dashboard && (
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-slate-500">Present</p>
                <p className="text-lg font-semibold text-slate-900">{dashboard.summary.present}</p>
              </div>
              <div>
                <p className="text-slate-500">Absent</p>
                <p className="text-lg font-semibold text-rose-500">{dashboard.summary.absent}</p>
              </div>
              <div>
                <p className="text-slate-500">Late</p>
                <p className="text-lg font-semibold text-amber-500">{dashboard.summary.late}</p>
              </div>
              <div>
                <p className="text-slate-500">On Leave</p>
                <p className="text-lg font-semibold text-slate-900">{dashboard.summary.leave}</p>
              </div>
            </div>
          )}
        </Card>
        <Card
          title="Mark Attendance"
          className="lg:col-span-2"
          actions={
            <Button variant="primary" onClick={handleSubmit}>
              Submit Attendance
            </Button>
          }
        >
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Student
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Status
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {students.map((student) => (
                  <tr key={student.studentId} className="bg-white">
                    <td className="px-3 py-3 text-sm font-medium text-slate-900">
                      {student.studentId}
                    </td>
                    <td className="px-3 py-3 text-sm text-slate-600">
                      {draft[student.studentId] ?? student.status}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex justify-end gap-2">
                        {attendanceStatuses.map((option) => (
                          <Button
                            key={option.value}
                            variant={
                              (draft[student.studentId] ?? student.status) === option.value
                                ? 'primary'
                                : 'ghost'
                            }
                            onClick={() => handleSetStatus(student.studentId, option.value)}
                          >
                            {option.label}
                          </Button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
                {!students.length && (
                  <tr>
                    <td colSpan={3} className="px-3 py-6 text-center text-sm text-slate-500">
                      No students assigned to this class yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </DashboardShell>
  );
}
