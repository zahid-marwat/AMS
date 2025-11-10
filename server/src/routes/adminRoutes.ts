import { Router } from 'express';
import { authenticate } from '@/middlewares/authenticate';
import { adminController } from '@/controllers/adminController';

const router = Router();

// All routes require authentication with ADMIN role
router.use(authenticate(['ADMIN']));

// Overview & analytics
router.get('/overview', adminController.getOverview);
router.get('/school/attendance-summary', adminController.getSchoolAttendanceSummary);
router.get('/students/daily-attendance', adminController.getStudentDailyAttendance);

// Classes management
router.get('/classes', adminController.listClasses);
router.post('/classes', adminController.createClass);
router.put('/classes/:classId', adminController.updateClass);
router.delete('/classes/:classId', adminController.deleteClass);
router.get('/classes/:classId/attendance', adminController.getAttendanceForClass);
router.get('/classes/:classId/attendance-summary', adminController.getAttendanceSummary);

// Students management
router.get('/students', adminController.listStudents);
router.post('/students', adminController.createStudent);
router.put('/students/:studentId', adminController.updateStudent);
router.delete('/students/:studentId', adminController.deleteStudent);

// Teachers management
router.get('/teachers', adminController.listTeachers);
router.post('/teachers', adminController.createTeacher);
router.put('/teachers/:teacherId', adminController.updateTeacher);
router.get('/teachers/:teacherId/detail', adminController.getTeacherDetail);

export default router;
