import { prisma } from '@/lib/prisma';
import { AttendanceStatus } from '@prisma/client';

export const attendanceRepository = {
  listForClass(classId: string, params: { startDate?: Date; endDate?: Date }) {
    return prisma.attendanceRecord.findMany({
      where: {
        classId,
        ...(params.startDate && { date: { gte: params.startDate } }),
        ...(params.endDate && { date: { lte: params.endDate } }),
      },
      include: {
        student: true,
      },
      orderBy: { date: 'desc' },
    });
  },

  recordAttendance(
    classId: string,
    recordedBy: string,
    submissions: Array<{ studentId: string; status: AttendanceStatus; date: Date }>,
  ) {
    return prisma.$transaction(
      submissions.map((submission) =>
        prisma.attendanceRecord.upsert({
          where: {
            studentId_date: {
              studentId: submission.studentId,
              date: submission.date,
            },
          },
          update: {
            status: submission.status,
            recordedBy,
            classId,
          },
          create: {
            classId,
            recordedBy,
            studentId: submission.studentId,
            status: submission.status,
            date: submission.date,
          },
        }),
      ),
    );
  },
};
