import { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { teacherService } from '@/services/teacher';
import type { AttendanceStatus } from '@/types';
import type {
  TeacherDashboardNotification,
  TeacherDashboardResponse,
  TeacherDashboardSubmission,
} from '@/types/teacher';

const attendanceOptions: Array<{ label: string; value: AttendanceStatus }> = [
  { label: 'Present', value: 'present' },
  { label: 'Absent', value: 'absent' },
  { label: 'Late', value: 'late' },
  { label: 'On Leave', value: 'leave' },
];

const statusColors: Record<AttendanceStatus, string> = {
  present: 'bg-emerald-100 text-emerald-700',
  absent: 'bg-rose-100 text-rose-700',
  late: 'bg-amber-100 text-amber-700',
  leave: 'bg-slate-200 text-slate-700',
};

type DraftState = Record<string, AttendanceStatus>;
type SubmissionRequest = Array<{ studentId: string; status: AttendanceStatus }>;

const getInitialDraft = (submissions: TeacherDashboardSubmission[]): DraftState => {
  return submissions.reduce<DraftState>((acc, submission) => {
    acc[submission.studentId] = submission.status;
    return acc;
  }, {});
};

const buildPayload = (
  submissions: TeacherDashboardSubmission[],
  draft: DraftState,
): SubmissionRequest =>
  submissions.map((submission) => ({
    studentId: submission.studentId,
    status: draft[submission.studentId] ?? submission.status,
  }));

export default function TeacherDashboardPage() {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<DraftState>({});
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const {
    data: dashboard,
    isLoading,
    isError,
    error,
  } = useQuery<TeacherDashboardResponse>({
    queryKey: ['teacher-dashboard'],
    queryFn: teacherService.getDashboard,
  });

  const submissions = dashboard?.submissions ?? [];

  useEffect(() => {
    if (dashboard) {
      setDraft(getInitialDraft(dashboard.submissions));
    }
  }, [dashboard]);

  const saveDraftMutation = useMutation<void, Error, SubmissionRequest>({
    mutationFn: async (payload) => {
      if (!dashboard?.classId) return;
      await teacherService.saveDraft(dashboard.classId, payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['teacher-dashboard'] });
      setStatusMessage('Draft saved');
    },
  });

  const submitMutation = useMutation<void, Error, SubmissionRequest>({
    mutationFn: async (payload) => {
      if (!dashboard?.classId) return;
      await teacherService.submitAttendance(dashboard.classId, payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['teacher-dashboard'] });
      setStatusMessage('Attendance submitted');
    },
  });

  const hasChanges = useMemo(() => {
    if (!dashboard) return false;
    return dashboard.submissions.some((submission) => {
      const selected = draft[submission.studentId];
      return selected && selected !== submission.status;
    });
  }, [dashboard, draft]);

  const totalSelections = useMemo(() => {
    if (!dashboard) {
      return { present: 0, absent: 0, late: 0, leave: 0 } as Record<AttendanceStatus, number>;
    }
    return dashboard.submissions.reduce(
      (acc, submission) => {
        const value = draft[submission.studentId] ?? submission.status;
        acc[value] += 1;
        return acc;
      },
      { present: 0, absent: 0, late: 0, leave: 0 } as Record<AttendanceStatus, number>,
    );
  }, [dashboard, draft]);

  const handleSetStatus = (studentId: string, status: AttendanceStatus) => {
    setDraft((prev) => ({ ...prev, [studentId]: status }));
  };

  const handleMarkAll = (status: AttendanceStatus) => {
    if (!dashboard) return;
    setDraft(
      dashboard.submissions.reduce<DraftState>((acc, submission) => {
        acc[submission.studentId] = status;
        return acc;
      }, {}),
    );
  };

  const handleReset = () => {
    if (!dashboard) return;
    setDraft(getInitialDraft(dashboard.submissions));
  };

  const handleSaveDraft = async () => {
    if (!dashboard?.classId) return;
    const payload = buildPayload(submissions, draft);
    await saveDraftMutation.mutateAsync(payload);
  };

  const handleSubmit = async () => {
    if (!dashboard?.classId) return;
    const payload = buildPayload(submissions, draft);
    await submitMutation.mutateAsync(payload);
  };

  useEffect(() => {
    if (!statusMessage) return undefined;
    const timer = window.setTimeout(() => setStatusMessage(null), 4000);
    return () => {
      window.clearTimeout(timer);
    };
  }, [statusMessage]);

  if (isLoading) {
    return (
      <DashboardShell title="Daily Attendance" role="teacher">
        <Card>
          <p className="text-sm text-slate-500">Loading dashboard…</p>
        </Card>
      </DashboardShell>
    );
  }

  if (isError) {
    return (
      <DashboardShell title="Daily Attendance" role="teacher">
        <Card>
          <p className="text-sm text-rose-500">Failed to load dashboard: {(error as Error).message}</p>
        </Card>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title="Daily Attendance" role="teacher">
      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Class Snapshot" className="lg:col-span-1">
          <div className="space-y-4 text-sm">
            <div>
              <p className="text-slate-500">Class</p>
              <p className="text-lg font-semibold text-slate-900">{dashboard?.className ?? '—'}</p>
            </div>
            <div>
              <p className="text-slate-500">Date</p>
              <p className="text-lg font-semibold text-slate-900">{dashboard?.date ?? '—'}</p>
            </div>
            {dashboard?.quickActions.lastSubmittedAt && (
              <div>
                <p className="text-slate-500">Last submitted</p>
                <p className="text-sm text-slate-800">{new Date(dashboard.quickActions.lastSubmittedAt).toLocaleString()}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              {attendanceOptions.map((option) => (
                <div key={option.value} className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500">{option.label}</p>
                  <p className="text-xl font-semibold text-slate-900">{totalSelections[option.value]}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card
          title="Mark Attendance"
          className="lg:col-span-2"
          actions={
            <div className="flex flex-wrap gap-2">
              <Button variant="ghost" onClick={() => handleMarkAll('present')} disabled={!submissions.length}>
                Mark All Present
              </Button>
              <Button variant="ghost" onClick={handleReset} disabled={!submissions.length || !hasChanges}>
                Reset Changes
              </Button>
              <Button
                variant="secondary"
                onClick={handleSaveDraft}
                disabled={!dashboard?.classId || saveDraftMutation.isPending}
              >
                {saveDraftMutation.isPending ? 'Saving…' : 'Save Draft'}
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!dashboard?.classId || submitMutation.isPending}
              >
                {submitMutation.isPending ? 'Submitting…' : 'Submit Attendance'}
              </Button>
            </div>
          }
        >
          {statusMessage && (
            <p className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {statusMessage}
            </p>
          )}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Roll #
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Student
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Current Status
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Last Update
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {submissions.map((submission) => {
                  const selectedStatus = draft[submission.studentId] ?? submission.status;
                  return (
                    <tr key={submission.studentId} className="bg-white">
                      <td className="px-3 py-3 text-sm font-semibold text-slate-900">
                        {submission.rollNumber}
                      </td>
                      <td className="px-3 py-3 text-sm font-semibold text-slate-900">
                        <div className="flex flex-col">
                          <span>{submission.studentName}</span>
                          <span className="text-xs font-normal text-slate-500">ID: {submission.studentId}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-sm text-slate-600">
                        <span className={clsx('inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold', statusColors[selectedStatus])}>
                          {selectedStatus.charAt(0).toUpperCase() + selectedStatus.slice(1)}
                        </span>
                        <div className="mt-1 text-xs text-slate-500">
                          {submission.hasRecord ? 'Submitted' : submission.isDraft ? 'Draft saved' : 'Not yet marked'}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-xs text-slate-500">
                        {submission.lastUpdated ? new Date(submission.lastUpdated).toLocaleString() : '—'}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex justify-end gap-2">
                          {attendanceOptions.map((option) => (
                            <Button
                              key={option.value}
                              variant={selectedStatus === option.value ? 'primary' : 'ghost'}
                              onClick={() => handleSetStatus(submission.studentId, option.value)}
                            >
                              {option.label}
                            </Button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!submissions.length && (
                  <tr>
                    <td colSpan={5} className="px-3 py-6 text-center text-sm text-slate-500">
                      No students assigned to this class yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="lg:col-span-3 grid gap-6 md:grid-cols-2">
          <Card title="Quick Actions">
            <div className="grid gap-4 text-sm">
              <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Pending Students</p>
                  <p className="text-lg font-semibold text-slate-900">{dashboard?.quickActions.pendingStudents ?? 0}</p>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Draft Entries</p>
                  <p className="text-lg font-semibold text-slate-900">{dashboard?.quickActions.draftCount ?? 0}</p>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Next Class</p>
                  <p className="text-sm text-slate-700">{dashboard?.quickActions.nextClass ?? '—'}</p>
                </div>
              </div>
            </div>
          </Card>

          <Card title="Notifications">
            <div className="space-y-3 text-sm">
              {dashboard?.notifications.length ? (
                dashboard.notifications.map((notification: TeacherDashboardNotification) => (
                  <div key={notification.id} className="rounded-lg border border-slate-200 p-3">
                    <div className="flex items-center justify-between text-xs uppercase tracking-wide">
                      <span className={notification.type === 'warning' ? 'text-amber-600' : 'text-slate-500'}>
                        {notification.type === 'warning' ? 'Action Needed' : 'Reminder'}
                      </span>
                      <span className="text-slate-400">{notification.date}</span>
                    </div>
                    <p className="mt-2 text-slate-700">{notification.message}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No notifications right now.</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
