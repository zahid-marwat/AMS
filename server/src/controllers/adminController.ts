import type { Request, Response, NextFunction } from 'express';
import { adminService } from '@/services/adminService';

export const adminController = {
  async getOverview(_req: Request, res: Response, next: NextFunction) {
    try {
      const overview = await adminService.getOverview();
      res.json(overview);
    } catch (error) {
      next(error);
    }
  },

  async listClasses(_req: Request, res: Response, next: NextFunction) {
    try {
      const classes = await adminService.listClasses();
      res.json(classes);
    } catch (error) {
      next(error);
    }
  },

  async listStudents(_req: Request, res: Response, next: NextFunction) {
    try {
      const students = await adminService.listStudents();
      res.json(students);
    } catch (error) {
      next(error);
    }
  },

  async listTeachers(_req: Request, res: Response, next: NextFunction) {
    try {
      const teachers = await adminService.listTeachers();
      res.json(teachers);
    } catch (error) {
      next(error);
    }
  },

  async createClass(req: Request, res: Response, next: NextFunction) {
    try {
      const newClass = await adminService.recordClass(req.body);
      res.status(201).json(newClass);
    } catch (error) {
      next(error);
    }
  },

  async updateClass(req: Request, res: Response, next: NextFunction) {
    try {
      const { classId } = req.params;
      const updatedClass = await adminService.updateClass(classId, req.body);
      res.json(updatedClass);
    } catch (error) {
      next(error);
    }
  },

  async deleteClass(req: Request, res: Response, next: NextFunction) {
    try {
      const { classId } = req.params;
      await adminService.deleteClass(classId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },

  async createStudent(req: Request, res: Response, next: NextFunction) {
    try {
      const newStudent = await adminService.createStudent(req.body);
      res.status(201).json(newStudent);
    } catch (error) {
      next(error);
    }
  },

  async updateStudent(req: Request, res: Response, next: NextFunction) {
    try {
      const { studentId } = req.params;
      const updatedStudent = await adminService.updateStudent(studentId, req.body);
      res.json(updatedStudent);
    } catch (error) {
      next(error);
    }
  },

  async createTeacher(req: Request, res: Response, next: NextFunction) {
    try {
      const newTeacher = await adminService.createTeacher(req.body);
      res.status(201).json(newTeacher);
    } catch (error) {
      next(error);
    }
  },

  async deleteStudent(req: Request, res: Response, next: NextFunction) {
    try {
      const { studentId } = req.params;
      await adminService.deleteStudent(studentId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },

  async getAttendanceForClass(req: Request, res: Response, next: NextFunction) {
    try {
      const { classId } = req.params;
      const attendance = await adminService.getAttendanceForClass(classId);
      res.json(attendance);
    } catch (error) {
      next(error);
    }
  },

  async getAttendanceSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const { classId } = req.params;
      const { startDate, endDate, period } = req.query;
      
      const params = {
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        period: (period as 'daily' | 'weekly' | 'monthly' | 'yearly') || 'daily',
      };
      
      const summary = await adminService.getAttendanceSummary(classId, params);
      res.json(summary);
    } catch (error) {
      next(error);
    }
  },

  async getTeacherDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const { teacherId } = req.params;
      const { startDate, endDate, period } = req.query;
      
      const params = {
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        period: (period as 'daily' | 'weekly' | 'monthly' | 'yearly') || 'monthly',
      };
      
      const detail = await adminService.getTeacherDetail(teacherId, params);
      res.json(detail);
    } catch (error) {
      next(error);
    }
  },

  async getSchoolAttendanceSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate, period } = req.query;
      
      const params = {
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        period: (period as 'daily' | 'weekly' | 'monthly' | 'yearly') || 'daily',
      };
      
      const summary = await adminService.getSchoolAttendanceSummary(params);
      res.json(summary);
    } catch (error) {
      next(error);
    }
  },

  async getStudentDailyAttendance(req: Request, res: Response, next: NextFunction) {
    try {
      const { classId, startDate, endDate, period } = req.query;
      
      const params = {
        classId: classId as string | undefined,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        period: (period as 'daily' | 'weekly' | 'monthly' | 'yearly') || 'weekly',
      };
      
      const data = await adminService.getStudentDailyAttendance(params);
      res.json(data);
    } catch (error) {
      next(error);
    }
  },
};
