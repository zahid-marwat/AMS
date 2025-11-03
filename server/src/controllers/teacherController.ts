import type { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { teacherService } from '@/services/teacherService';
import { AppError } from '@/utils/appError';

const ensureTeacherId = (req: Request<any, any, any, any>): string => {
  if (!req.userId) {
    throw new AppError('Authentication required', StatusCodes.UNAUTHORIZED);
  }
  return req.userId;
};

type SubmissionPayload = Array<{ studentId: string; status: string }>;

type HistoryQuery = {
  startDate?: string;
  endDate?: string;
};

type DetailsQuery = {
  date?: string;
};

export const teacherController = {
  async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const teacherId = ensureTeacherId(req);
      const dashboard = await teacherService.getDashboard(teacherId);
      res.json(dashboard);
    } catch (error) {
      next(error);
    }
  },

  async saveAttendanceDraft(req: Request, res: Response, next: NextFunction) {
    try {
      const teacherId = ensureTeacherId(req);
      const { classId, submissions } = req.body as {
        classId?: string;
        submissions?: SubmissionPayload;
      };

      if (!classId) {
        throw new AppError('classId is required', StatusCodes.BAD_REQUEST);
      }

      await teacherService.saveAttendanceDraft(
        teacherId,
        classId,
        Array.isArray(submissions) ? submissions : [],
      );
      res.status(StatusCodes.NO_CONTENT).send();
    } catch (error) {
      next(error);
    }
  },

  async submitAttendance(req: Request, res: Response, next: NextFunction) {
    try {
      const teacherId = ensureTeacherId(req);
      const { classId, submissions } = req.body as {
        classId?: string;
        submissions?: SubmissionPayload;
      };

      if (!classId) {
        throw new AppError('classId is required', StatusCodes.BAD_REQUEST);
      }

      await teacherService.submitAttendance(
        teacherId,
        classId,
        Array.isArray(submissions) ? submissions : [],
      );
      res.status(StatusCodes.NO_CONTENT).send();
    } catch (error) {
      next(error);
    }
  },

  async getAttendanceHistory(req: Request<unknown, unknown, unknown, HistoryQuery>, res: Response, next: NextFunction) {
    try {
      const teacherId = ensureTeacherId(req);
      const { startDate, endDate } = req.query ?? {};
      const history = await teacherService.getAttendanceHistory(teacherId, {
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      });
      res.json(history);
    } catch (error) {
      next(error);
    }
  },

  async getAttendanceDetails(req: Request<unknown, unknown, unknown, DetailsQuery>, res: Response, next: NextFunction) {
    try {
      const teacherId = ensureTeacherId(req);
      const { date } = req.query ?? {};

      if (!date) {
        throw new AppError('date is required', StatusCodes.BAD_REQUEST);
      }

      const details = await teacherService.getAttendanceDetails(teacherId, new Date(date));
      res.json(details);
    } catch (error) {
      next(error);
    }
  },

  async updateAttendanceByDate(req: Request, res: Response, next: NextFunction) {
    try {
      const teacherId = ensureTeacherId(req);
      const { classId } = req.params as { classId?: string };
      const { date, submissions } = req.body as {
        date?: string;
        submissions?: SubmissionPayload;
      };

      if (!classId) {
        throw new AppError('classId is required', StatusCodes.BAD_REQUEST);
      }

      if (!date) {
        throw new AppError('date is required', StatusCodes.BAD_REQUEST);
      }

      await teacherService.updateAttendanceByDate(
        teacherId,
        classId,
        new Date(date),
        Array.isArray(submissions) ? submissions : [],
      );
      res.status(StatusCodes.NO_CONTENT).send();
    } catch (error) {
      next(error);
    }
  },

  async getStudentInsights(req: Request, res: Response, next: NextFunction) {
    try {
      const teacherId = ensureTeacherId(req);
      const insights = await teacherService.getStudentInsights(teacherId);
      res.json(insights);
    } catch (error) {
      next(error);
    }
  },

  async getClassAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const teacherId = ensureTeacherId(req);
      const analytics = await teacherService.getClassAnalytics(teacherId);
      res.json(analytics);
    } catch (error) {
      next(error);
    }
  },

  async getNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      const teacherId = ensureTeacherId(req);
      const notifications = await teacherService.getNotifications(teacherId);
      res.json(notifications);
    } catch (error) {
      next(error);
    }
  },

  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const teacherId = ensureTeacherId(req);
      const profile = await teacherService.getProfile(teacherId);
      res.json(profile);
    } catch (error) {
      next(error);
    }
  },

  async listClassStudents(req: Request, res: Response, next: NextFunction) {
    try {
      const teacherId = ensureTeacherId(req);
      const { classId } = req.params as { classId?: string };

      if (!classId) {
        throw new AppError('classId is required', StatusCodes.BAD_REQUEST);
      }

      const students = await teacherService.getClassStudents(teacherId, classId);
      res.json(students);
    } catch (error) {
      next(error);
    }
  },
};
