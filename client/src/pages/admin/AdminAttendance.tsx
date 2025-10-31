import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { adminService } from '@/services/admin';
import type { ClassSummary } from '@/types';

type Period = 'daily' | 'weekly' | 'monthly' | 'yearly';
type ViewMode = 'class' | 'school' | 'students';

export default function AdminAttendancePage() {
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [period, setPeriod] = useState<Period>('weekly');
  const [viewMode, setViewMode] = useState<ViewMode>('class');
  const [showStudents, setShowStudents] = useState(false);
  const [showDailyRecords, setShowDailyRecords] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<{ name: string; records: Array<{ date: string; status: string }> } | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<'present' | 'absent' | 'late' | 'leave' | null>(null);

  const { data: classes = [] } = useQuery<ClassSummary[]>({
    queryKey: ['admin-classes'],
    queryFn: adminService.listClasses,
  });

  // Class-specific attendance
  const { data: classSummary, isLoading: isLoadingClass } = useQuery({
    queryKey: ['admin-attendance-summary', selectedClass, period],
    queryFn: () => adminService.getAttendanceSummary(selectedClass, { period }),
    enabled: viewMode === 'class' && !!selectedClass,
  });

  // School-wide attendance
  const { data: schoolSummary, isLoading: isLoadingSchool } = useQuery({
    queryKey: ['admin-school-attendance-summary', period],
    queryFn: () => adminService.getSchoolAttendanceSummary({ period }),
    enabled: viewMode === 'school',
  });

  // Individual students daily attendance
  const { data: studentsDailyData, isLoading: isLoadingStudents } = useQuery({
    queryKey: ['admin-students-daily-attendance', selectedClass, period],
    queryFn: () => adminService.getStudentDailyAttendance({ classId: selectedClass || undefined, period }),
    enabled: viewMode === 'students',
  });

  const summary = viewMode === 'class' ? classSummary : schoolSummary;
  const isLoading = viewMode === 'class' ? isLoadingClass : viewMode === 'school' ? isLoadingSchool : isLoadingStudents;
  const selectedClassName = classes.find(c => c.id === selectedClass)?.name || '';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'bg-emerald-50 border-emerald-200 text-emerald-700';
      case 'absent': return 'bg-rose-50 border-rose-200 text-rose-700';
      case 'late': return 'bg-amber-50 border-amber-200 text-amber-700';
      case 'leave': return 'bg-blue-50 border-blue-200 text-blue-700';
      default: return 'bg-slate-50 border-slate-200 text-slate-700';
    }
  };

  const getPercentage = (value: number, total: number) => {
    return total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
  };

  const filteredStudents = selectedStatus && classSummary
    ? classSummary.students.filter(s => s[selectedStatus] > 0).sort((a, b) => b[selectedStatus] - a[selectedStatus])
    : classSummary?.students || [];

  const filteredClasses = selectedStatus && schoolSummary
    ? schoolSummary.classes.filter(c => c[selectedStatus] > 0).sort((a, b) => b[selectedStatus] - a[selectedStatus])
    : schoolSummary?.classes || [];

  // Filter detailed records by status when a card is clicked
  const filteredRecords = selectedStatus
    ? (viewMode === 'class' ? classSummary?.records : schoolSummary?.records)?.filter(
        r => r.status === selectedStatus.toUpperCase()
      ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    : [];

  return (
    <DashboardShell title="Attendance Analytics" role="admin">
      <div className="space-y-6">
        {/* Filters */}
        <Card title="Filters">
          <div className="space-y-4">
            {/* View Mode Toggle */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                View Mode
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setViewMode('class')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                    viewMode === 'class'
                      ? 'bg-brand text-white border-brand'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  📚 Class Summary
                </button>
                <button
                  onClick={() => setViewMode('school')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                    viewMode === 'school'
                      ? 'bg-brand text-white border-brand'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  🏫 School Summary
                </button>
                <button
                  onClick={() => setViewMode('students')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                    viewMode === 'students'
                      ? 'bg-brand text-white border-brand'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  👤 Individual Students
                </button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {/* Class Selector - Show in class and students mode */}
              {(viewMode === 'class' || viewMode === 'students') && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Select Class
                  </label>
                  <select
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                  >
                    <option value="">Choose a class...</option>
                    {classes.map((klass) => (
                      <option key={klass.id} value={klass.id}>
                        {klass.name} ({klass.gradeLevel})
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              {/* Time Period */}
              <div className={viewMode === 'school' ? 'md:col-span-2' : ''}>
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
            </div>
          </div>
        </Card>

        {/* Summary Cards */}
        {summary && (
          <>
            <div className="grid gap-4 md:grid-cols-5">
              <Card 
                title="Total Records" 
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => { setSelectedStatus(null); setShowStudents(true); }}
              >
                <p className="text-3xl font-bold text-slate-900">{summary.summary.total}</p>
                <p className="text-sm text-slate-500 mt-1">
                  {summary.startDate} to {summary.endDate}
                </p>
              </Card>

              <Card 
                title="Present" 
                className={`cursor-pointer hover:shadow-lg transition-shadow border-2 ${getStatusColor('present')}`}
                onClick={() => { setSelectedStatus('present'); setShowStudents(true); }}
              >
                <p className="text-3xl font-bold">{summary.summary.present}</p>
                <p className="text-sm mt-1">
                  {getPercentage(summary.summary.present, summary.summary.total)}% of total
                </p>
              </Card>

              <Card 
                title="Absent" 
                className={`cursor-pointer hover:shadow-lg transition-shadow border-2 ${getStatusColor('absent')}`}
                onClick={() => { setSelectedStatus('absent'); setShowStudents(true); }}
              >
                <p className="text-3xl font-bold">{summary.summary.absent}</p>
                <p className="text-sm mt-1">
                  {getPercentage(summary.summary.absent, summary.summary.total)}% of total
                </p>
              </Card>

              <Card 
                title="Late" 
                className={`cursor-pointer hover:shadow-lg transition-shadow border-2 ${getStatusColor('late')}`}
                onClick={() => { setSelectedStatus('late'); setShowStudents(true); }}
              >
                <p className="text-3xl font-bold">{summary.summary.late}</p>
                <p className="text-sm mt-1">
                  {getPercentage(summary.summary.late, summary.summary.total)}% of total
                </p>
              </Card>

              <Card 
                title="Leave" 
                className={`cursor-pointer hover:shadow-lg transition-shadow border-2 ${getStatusColor('leave')}`}
                onClick={() => { setSelectedStatus('leave'); setShowStudents(true); }}
              >
                <p className="text-3xl font-bold">{summary.summary.leave}</p>
                <p className="text-sm mt-1">
                  {getPercentage(summary.summary.leave, summary.summary.total)}% of total
                </p>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-3">
              <Button 
                variant="primary" 
                onClick={() => { setSelectedStatus(null); setShowStudents(true); }}
              >
                {viewMode === 'class' ? 'View Individual Student Summary' : 'View Class Breakdown'}
              </Button>
            </div>
          </>
        )}

        {/* Individual Students View */}
        {viewMode === 'students' && studentsDailyData && (
          <Card title={`Individual Student Attendance Records (${studentsDailyData.students.length} students)`}>
            <div className="space-y-4">
              <div className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3">
                <p><strong>Period:</strong> {studentsDailyData.period}</p>
                <p><strong>Date Range:</strong> {studentsDailyData.startDate} to {studentsDailyData.endDate}</p>
                <p className="mt-2 text-slate-700">Click on any student to view their day-by-day attendance records</p>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Student Name
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Class
                      </th>
                      <th className="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Present
                      </th>
                      <th className="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Absent
                      </th>
                      <th className="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Late
                      </th>
                      <th className="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Leave
                      </th>
                      <th className="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Total Days
                      </th>
                      <th className="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Attendance %
                      </th>
                      <th className="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {studentsDailyData.students.map((student) => {
                      const attendanceRate = getPercentage(student.summary.present, student.summary.total);
                      return (
                        <tr key={student.id} className="hover:bg-slate-50">
                          <td className="px-3 py-3 text-sm font-medium text-slate-900">
                            {student.name}
                          </td>
                          <td className="px-3 py-3 text-sm text-slate-600">
                            {student.className}
                          </td>
                          <td className="px-3 py-3 text-sm text-center">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                              {student.summary.present}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-sm text-center">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-rose-100 text-rose-800">
                              {student.summary.absent}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-sm text-center">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                              {student.summary.late}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-sm text-center">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {student.summary.leave}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-sm text-center font-semibold text-slate-700">
                            {student.summary.total}
                          </td>
                          <td className="px-3 py-3 text-sm text-center">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${
                              parseFloat(attendanceRate) >= 90 ? 'bg-emerald-100 text-emerald-800' :
                              parseFloat(attendanceRate) >= 75 ? 'bg-amber-100 text-amber-800' :
                              'bg-rose-100 text-rose-800'
                            }`}>
                              {attendanceRate}%
                            </span>
                          </td>
                          <td className="px-3 py-3 text-sm text-center">
                            <Button
                              variant="secondary"
                              onClick={() => {
                                setSelectedStudent({ name: student.name, records: student.dailyRecords });
                                setShowDailyRecords(true);
                              }}
                              className="text-xs"
                            >
                              View Details
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                    {studentsDailyData.students.length === 0 && (
                      <tr>
                        <td colSpan={9} className="px-3 py-6 text-center text-sm text-slate-500">
                          No students found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        )}

        {/* Empty State - Only for class and students mode */}
        {(viewMode === 'class' || viewMode === 'students') && !selectedClass && (
          <Card>
            <div className="py-12 text-center">
              <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-slate-900">No class selected</h3>
              <p className="mt-1 text-sm text-slate-500">Select a class above to view attendance analytics</p>
            </div>
          </Card>
        )}

        {isLoading && (
          <Card>
            <div className="py-12 text-center">
              <p className="text-slate-500">Loading attendance data...</p>
            </div>
          </Card>
        )}
      </div>

      {/* Details Modal - Students for Class, Classes for School */}
      <Modal
        isOpen={showStudents}
        onClose={() => { setShowStudents(false); setSelectedStatus(null); }}
        title={
          viewMode === 'class'
            ? (selectedStatus 
                ? `Students with ${selectedStatus.charAt(0).toUpperCase() + selectedStatus.slice(1)} Status - ${selectedClassName}`
                : `All Students - ${selectedClassName}`)
            : (selectedStatus
                ? `Classes with ${selectedStatus.charAt(0).toUpperCase() + selectedStatus.slice(1)} Status - Whole School`
                : 'All Classes - Whole School')
        }
      >
        <div className="space-y-4">
          <div className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3">
            <p><strong>View Mode:</strong> {viewMode === 'class' ? '📚 Individual Class' : '🏫 Whole School'}</p>
            <p><strong>Period:</strong> {summary?.period}</p>
            <p><strong>Date Range:</strong> {summary?.startDate} to {summary?.endDate}</p>
            {selectedStatus && (
              <p className="mt-2 text-slate-700">
                Showing all <strong>{selectedStatus}</strong> records sorted by date (newest first)
              </p>
            )}
          </div>

          {selectedStatus && filteredRecords && (
            <div className="overflow-x-auto max-h-96">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Student Name
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Class
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Date
                    </th>
                    <th className="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {filteredRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-slate-50">
                      <td className="px-3 py-3 text-sm font-medium text-slate-900">
                        {record.studentName}
                      </td>
                      <td className="px-3 py-3 text-sm text-slate-600">
                        {record.className}
                      </td>
                      <td className="px-3 py-3 text-sm text-slate-700">
                        {new Date(record.date).toLocaleDateString('en-US', { 
                          weekday: 'short',
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </td>
                      <td className="px-3 py-3 text-sm text-center">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                          record.status === 'PRESENT' ? 'bg-emerald-100 text-emerald-800' :
                          record.status === 'ABSENT' ? 'bg-rose-100 text-rose-800' :
                          record.status === 'LATE' ? 'bg-amber-100 text-amber-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {record.status === 'PRESENT' ? '✓ Present' :
                           record.status === 'ABSENT' ? '✗ Absent' :
                           record.status === 'LATE' ? '⏰ Late' :
                           '📋 Leave'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredRecords.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-3 py-6 text-center text-sm text-slate-500">
                        No records found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {!selectedStatus && (
          <div className="overflow-x-auto max-h-96">
            {viewMode === 'class' ? (
              /* Students Table for Class View */
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Student
                    </th>
                    <th className="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Present
                    </th>
                    <th className="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Absent
                    </th>
                    <th className="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Late
                    </th>
                    <th className="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Leave
                    </th>
                    <th className="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Total
                    </th>
                    <th className="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Attendance %
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {filteredStudents.map((student) => {
                    const attendanceRate = getPercentage(student.present, student.total);
                    return (
                      <tr key={student.id}>
                        <td className="px-3 py-3 text-sm font-medium text-slate-900">
                          {student.name}
                        </td>
                        <td className="px-3 py-3 text-sm text-center">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                            {student.present}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-sm text-center">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-rose-100 text-rose-800">
                            {student.absent}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-sm text-center">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                            {student.late}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-sm text-center">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {student.leave}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-sm text-center font-semibold text-slate-700">
                          {student.total}
                        </td>
                        <td className="px-3 py-3 text-sm text-center">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${
                            parseFloat(attendanceRate) >= 90 ? 'bg-emerald-100 text-emerald-800' :
                            parseFloat(attendanceRate) >= 75 ? 'bg-amber-100 text-amber-800' :
                            'bg-rose-100 text-rose-800'
                          }`}>
                            {attendanceRate}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredStudents.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-3 py-6 text-center text-sm text-slate-500">
                        No students found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            ) : (
              /* Classes Table for School View */
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Class
                    </th>
                    <th className="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Present
                    </th>
                    <th className="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Absent
                    </th>
                    <th className="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Late
                    </th>
                    <th className="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Leave
                    </th>
                    <th className="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Total
                    </th>
                    <th className="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Attendance %
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {filteredClasses.map((klass) => {
                    const attendanceRate = getPercentage(klass.present, klass.total);
                    return (
                      <tr key={klass.id}>
                        <td className="px-3 py-3 text-sm font-medium text-slate-900">
                          {klass.name}
                        </td>
                        <td className="px-3 py-3 text-sm text-center">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                            {klass.present}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-sm text-center">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-rose-100 text-rose-800">
                            {klass.absent}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-sm text-center">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                            {klass.late}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-sm text-center">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {klass.leave}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-sm text-center font-semibold text-slate-700">
                          {klass.total}
                        </td>
                        <td className="px-3 py-3 text-sm text-center">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${
                            parseFloat(attendanceRate) >= 90 ? 'bg-emerald-100 text-emerald-800' :
                            parseFloat(attendanceRate) >= 75 ? 'bg-amber-100 text-amber-800' :
                            'bg-rose-100 text-rose-800'
                          }`}>
                            {attendanceRate}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredClasses.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-3 py-6 text-center text-sm text-slate-500">
                        No classes found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
          )}
        </div>
      </Modal>

      {/* Daily Records Modal */}
      <Modal
        isOpen={showDailyRecords}
        onClose={() => { setShowDailyRecords(false); setSelectedStudent(null); }}
        title={`Daily Attendance Records - ${selectedStudent?.name || ''}`}
      >
        {selectedStudent && (
          <div className="space-y-4">
            <div className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3">
              <p><strong>Total Records:</strong> {selectedStudent.records.length} days</p>
              <p className="mt-1 text-slate-700">Showing attendance for each day in the selected period</p>
            </div>

            <div className="overflow-x-auto max-h-96">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Date
                    </th>
                    <th className="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {selectedStudent.records.map((record, index) => (
                    <tr key={index} className="hover:bg-slate-50">
                      <td className="px-3 py-3 text-sm font-medium text-slate-900">
                        {new Date(record.date).toLocaleDateString('en-US', { 
                          weekday: 'short',
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </td>
                      <td className="px-3 py-3 text-sm text-center">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                          record.status === 'PRESENT' ? 'bg-emerald-100 text-emerald-800' :
                          record.status === 'ABSENT' ? 'bg-rose-100 text-rose-800' :
                          record.status === 'LATE' ? 'bg-amber-100 text-amber-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {record.status === 'PRESENT' ? '✓ Present' :
                           record.status === 'ABSENT' ? '✗ Absent' :
                           record.status === 'LATE' ? '⏰ Late' :
                           '📋 Leave'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {selectedStudent.records.length === 0 && (
                    <tr>
                      <td colSpan={2} className="px-3 py-6 text-center text-sm text-slate-500">
                        No attendance records found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>
    </DashboardShell>
  );
}
