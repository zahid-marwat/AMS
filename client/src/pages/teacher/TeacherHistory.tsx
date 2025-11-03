import { useQuery } from '@tanstack/react-query';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { Card } from '@/components/ui/Card';
import { teacherService, type TeacherAttendanceHistory } from '@/services/teacher';

export default function TeacherHistoryPage() {
  const { data: history, isLoading } = useQuery<TeacherAttendanceHistory>({
    queryKey: ['teacher-history'],
    queryFn: () => teacherService.getHistory({}),
  });

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
                <tr key={entry.date} className="bg-white">
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
    </DashboardShell>
  );
}
