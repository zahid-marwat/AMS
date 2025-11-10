import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { Card } from '@/components/ui/Card';
import {
  teacherService,
  type TeacherAttendanceDetails,
  type TeacherAttendanceHistory,
} from '@/services/teacher';
import type { AttendanceStatus } from '@/types';

export default function TeacherHistoryPage() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const { data: history, isLoading } = useQuery<TeacherAttendanceHistory>({
    queryKey: ['teacher-history'],
    queryFn: () => teacherService.getHistory({}),
  });

  useEffect(() => {
    if (history?.summaries.length && !selectedDate) {
      setSelectedDate(history.summaries[0]?.date ?? null);
    }
  }, [history, selectedDate]);

  const { data: details, isLoading: isDetailsLoading } = useQuery<TeacherAttendanceDetails>({
    queryKey: ['teacher-history-details', selectedDate],
    queryFn: () => teacherService.getAttendanceDetails(selectedDate ?? ''),
    enabled: Boolean(selectedDate),
  });

  const aggregate = useMemo(() => {
    if (!details?.length) {
      return null;
    }

    return details.reduce(
      (acc, klass) => {
        for (const submission of klass.submissions) {
          acc[submission.status] += 1;
        }
        acc.total += klass.submissions.length;
        return acc;
      },
      {
        present: 0,
        absent: 0,
        late: 0,
        leave: 0,
        total: 0,
      } as Record<AttendanceStatus | 'total', number>,
    );
  }, [details]);

  const formatStatus = (status: AttendanceStatus) => {
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
        return status;
    }
  };

  return (
    <DashboardShell title="Attendance History" role="teacher">
      <Card title="Recent Attendance">
        {isLoading && <p className="mb-4 text-sm text-slate-500">Loading history…</p>}
        {history && (
          <div className="mb-4 flex flex-wrap gap-4 text-sm">
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">Period</p>
              <p className="text-slate-700">
                {history.range.startDate} – {history.range.endDate}
              </p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">Total Present</p>
              <p className="text-lg font-semibold text-slate-900">{history.totals.present}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">Total Absent</p>
              <p className="text-lg font-semibold text-slate-900">{history.totals.absent}</p>
            </div>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Date
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
              {history?.summaries.map((entry) => (
                <tr
                  key={entry.date}
                  onClick={() => setSelectedDate(entry.date)}
                  className={`cursor-pointer bg-white transition hover:bg-slate-50 ${
                    selectedDate === entry.date ? 'bg-brand/10' : ''
                  }`}
                >
                  <td className="px-3 py-3 text-sm font-medium text-slate-900">{entry.date}</td>
                  <td className="px-3 py-3 text-sm text-slate-600">{entry.present}</td>
                  <td className="px-3 py-3 text-sm text-slate-600">{entry.absent}</td>
                  <td className="px-3 py-3 text-sm text-slate-600">{entry.late}</td>
                  <td className="px-3 py-3 text-sm text-slate-600">{entry.leave}</td>
                </tr>
              ))}
              {!history?.summaries.length && !isLoading && (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-sm text-slate-500">
                    No attendance records yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="Daily Attendance Overview">
        {!selectedDate && <p className="text-sm text-slate-500">Select a date to view details.</p>}

        {selectedDate && (
          <div className="space-y-6">
            <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Selected Date</p>
                <h3 className="text-lg font-semibold text-slate-900">
                  {format(parseISO(selectedDate), 'PPPP')}
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm text-slate-700 sm:grid-cols-5">
                <div className="rounded-lg bg-slate-50 px-3 py-2">
                  <p className="text-xs uppercase text-slate-500">Present</p>
                  <p className="text-lg font-semibold">{aggregate?.present ?? 0}</p>
                </div>
                <div className="rounded-lg bg-slate-50 px-3 py-2">
                  <p className="text-xs uppercase text-slate-500">Absent</p>
                  <p className="text-lg font-semibold">{aggregate?.absent ?? 0}</p>
                </div>
                <div className="rounded-lg bg-slate-50 px-3 py-2">
                  <p className="text-xs uppercase text-slate-500">Late</p>
                  <p className="text-lg font-semibold">{aggregate?.late ?? 0}</p>
                </div>
                <div className="rounded-lg bg-slate-50 px-3 py-2">
                  <p className="text-xs uppercase text-slate-500">Leave</p>
                  <p className="text-lg font-semibold">{aggregate?.leave ?? 0}</p>
                </div>
                <div className="rounded-lg bg-slate-50 px-3 py-2">
                  <p className="text-xs uppercase text-slate-500">Total</p>
                  <p className="text-lg font-semibold">{aggregate?.total ?? 0}</p>
                </div>
              </div>
            </header>

            {isDetailsLoading && <p className="text-sm text-slate-500">Loading attendance details…</p>}

            {!isDetailsLoading && (!details || details.length === 0) && (
              <p className="text-sm text-slate-500">No attendance records found for this date.</p>
            )}

            {details?.map((klass) => (
              <div key={klass.classId} className="rounded-lg border border-slate-200">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{klass.className}</p>
                    <p className="text-xs uppercase tracking-wide text-slate-500">{klass.submissions.length} students</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${klass.editable ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                    {klass.editable ? 'Editable' : 'Locked'}
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-white">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold text-slate-600">Roll #</th>
                        <th className="px-3 py-2 text-left font-semibold text-slate-600">Student</th>
                        <th className="px-3 py-2 text-left font-semibold text-slate-600">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {klass.submissions.map((submission) => (
                        <tr key={submission.studentId} className="bg-white">
                          <td className="px-3 py-2 font-medium text-slate-900">{submission.rollNumber}</td>
                          <td className="px-3 py-2 text-slate-700">{submission.studentName}</td>
                          <td className="px-3 py-2 font-medium text-slate-900">{formatStatus(submission.status)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </DashboardShell>
  );
}
