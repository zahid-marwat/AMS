import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import LoginPage from '@/pages/Login';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminClassesPage from '@/pages/admin/AdminClasses';
import AdminStudentsPage from '@/pages/admin/AdminStudents';
import AdminTeachersPage from '@/pages/admin/AdminTeachers';
import AdminAttendancePage from '@/pages/admin/AdminAttendance';
import TeacherDashboardPage from '@/pages/teacher/TeacherDashboard';
import TeacherHistoryPage from '@/pages/teacher/TeacherHistory';
import TeacherStudentsPage from '@/pages/teacher/TeacherStudents';
import { ProtectedRoute } from '@/routes/ProtectedRoute';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute allow={['admin']} />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/classes" element={<AdminClassesPage />} />
          <Route path="/admin/students" element={<AdminStudentsPage />} />
          <Route path="/admin/teachers" element={<AdminTeachersPage />} />
          <Route path="/admin/attendance" element={<AdminAttendancePage />} />
        </Route>

        <Route element={<ProtectedRoute allow={['teacher']} />}>
          <Route path="/teacher" element={<TeacherDashboardPage />} />
          <Route path="/teacher/history" element={<TeacherHistoryPage />} />
          <Route path="/teacher/students" element={<TeacherStudentsPage />} />
        </Route>

        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}
