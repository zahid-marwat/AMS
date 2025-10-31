import { useQuery } from '@tanstack/react-query';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { Card } from '@/components/ui/Card';
import { teacherService } from '@/services/teacher';
import type { AttendanceSummary } from '@/types';

export default function TeacherHistoryPage() {
  const { data: history = [] } = useQuery<AttendanceSummary[]>({
    queryKey: ['teacher-history'],
    queryFn: () => teacherService.getHistory({}),
  });

  return (
    <DashboardShell title="Attendance History" role="teacher">
      <Card title="Recent Attendance">
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
              {history.map((entry: AttendanceSummary) => (
                <tr key={entry.date} className="bg-white">
                  <td className="px-3 py-3 text-sm font-medium text-slate-900">{entry.date}</td>
                  <td className="px-3 py-3 text-sm text-slate-600">{entry.present}</td>
                  <td className="px-3 py-3 text-sm text-slate-600">{entry.absent}</td>
                  <td className="px-3 py-3 text-sm text-slate-600">{entry.late}</td>
                  <td className="px-3 py-3 text-sm text-slate-600">{entry.leave}</td>
                </tr>
              ))}
              {!history.length && (
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
