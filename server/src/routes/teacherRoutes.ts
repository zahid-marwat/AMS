import { Router } from 'express';
import { authenticate } from '@/middlewares/authenticate';
import { teacherController } from '@/controllers/teacherController';

const router = Router();

router.use(authenticate(['TEACHER']));

router.get('/dashboard', teacherController.getDashboard);
router.post('/attendance/draft', teacherController.saveAttendanceDraft);
router.post('/attendance/submit', teacherController.submitAttendance);
router.get('/attendance/history', teacherController.getAttendanceHistory);
router.get('/attendance/details', teacherController.getAttendanceDetails);
router.put('/attendance/:classId', teacherController.updateAttendanceByDate);
router.get('/classes/:classId/students', teacherController.listClassStudents);
router.get('/students/:studentId/monthly', teacherController.getStudentMonthlyAttendance);
router.get('/insights', teacherController.getStudentInsights);
router.get('/analytics', teacherController.getClassAnalytics);
router.get('/notifications', teacherController.getNotifications);
router.get('/profile', teacherController.getProfile);

export default router;
