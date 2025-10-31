import { useQuery } from '@tanstack/react-query';
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, Tooltip, Legend, BarChart, Bar, YAxis } from 'recharts';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { Card } from '@/components/ui/Card';
import { adminService } from '@/services/admin';

export default function AdminDashboard() {
  const { data: metrics, isLoading, error } = useQuery({
    queryKey: ['admin-overview'],
    queryFn: adminService.fetchOverview,
  });

  if (isLoading) {
    return (
      <DashboardShell title="School Overview" role="admin">
        <div className="flex items-center justify-center h-64">
          <p className="text-slate-500">Loading dashboard data...</p>
        </div>
      </DashboardShell>
    );
  }

  if (error) {
    return (
      <DashboardShell title="School Overview" role="admin">
        <div className="rounded-lg bg-rose-50 border border-rose-200 p-4 text-rose-700">
          <p className="font-semibold">Error loading dashboard</p>
          <p className="text-sm mt-1">{error instanceof Error ? error.message : 'Failed to fetch data'}</p>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title="School Overview" role="admin">
      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Active Students">
          <p className="text-3xl font-semibold text-slate-900">{metrics?.students.total ?? '—'}</p>
          <p className="mt-2 text-sm text-slate-500">
            {metrics?.students.delta ?? 0}% vs last month
          </p>
        </Card>
        <Card title="Attendance Rate">
          <p className="text-3xl font-semibold text-slate-900">
            {metrics ? `${Math.round(metrics.attendance.rate * 100)}%` : '—'}
          </p>
          <p className="mt-2 text-sm text-slate-500">Daily average across all classes</p>
        </Card>
        <Card title="Teacher Coverage">
          <p className="text-3xl font-semibold text-slate-900">
            {metrics?.teachers.coverage ?? '—'}
          </p>
          <p className="mt-2 text-sm text-slate-500">Classes assigned to teachers</p>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <Card title="Attendance Trend" className="lg:col-span-3">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics?.attendance.history ?? []}>
                <defs>
                  <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis tickFormatter={(value) => `${value}%`} />
                <Tooltip formatter={(value: number) => `${value}%`} />
                <Area
                  type="monotone"
                  dataKey="present"
                  stroke="#2563eb"
                  fill="url(#colorPresent)"
                  name="Present"
                />
                <Area type="monotone" dataKey="absent" stroke="#f97316" fill="#fed7aa" name="Absent" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Class Distribution" className="lg:col-span-2">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics?.classes.distribution ?? []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="students" fill="#2563eb" name="Students" />
                <Bar dataKey="attendance" fill="#f97316" name="Attendance %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </DashboardShell>
  );
}
