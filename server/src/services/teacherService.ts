import { differenceInCalendarDays, endOfDay, format, formatISO, isWithinInterval, startOfDay, subDays } from 'date-fns';
import type { Prisma } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';
import { prisma } from '@/lib/prisma';
import { AttendanceStatus } from '@/types/enums';
import { AppError } from '@/utils/appError';

const ATTENDANCE_CUTOFF_DAYS = 7;

type ClientAttendanceStatus = 'present' | 'absent' | 'late' | 'leave';

type DashboardSubmission = {
  studentId: string;
  studentName: string;
  status: ClientAttendanceStatus;
  hasRecord: boolean;
  isDraft: boolean;
  lastUpdated: string | null;
};

type DashboardNotification = {
  id: string;
  message: string;
  type: 'info' | 'warning';
  date: string;
};

type DashboardResponse = {
  date: string;
  classId: string | null;
  className: string | null;
  totalStudents: number;
  attendanceStatus: 'submitted' | 'draft' | 'pending' | 'no-class';
  summary: Record<ClientAttendanceStatus, number>;
  submissions: DashboardSubmission[];
  quickActions: {
    lastSubmittedAt: string | null;
    nextClass: string | null;
    pendingStudents: number;
    draftCount: number;
  };
  notifications: DashboardNotification[];
};

type AttendanceHistorySummary = {
  date: string;
  present: number;
  absent: number;
  late: number;
  leave: number;
  editable: boolean;
};

type StudentRow = {
  id: string;
  firstName: string;
  lastName: string;
};

type ClassWithStudents = {
  id: string;
  name: string;
  gradeLevel?: string | null;
  students: StudentRow[];
};

type StudentRosterEntry = StudentRow & { classId: string };

type AttendanceRecordRow = {
  id: string;
  studentId: string;
  classId: string;
  status: string;
  recordedBy: string;
  recordedAt: Date;
  date: Date;
};

type AttendanceDraftRow = {
  id: string;
  teacherId: string;
  classId: string;
  studentId: string;
  status: string;
  date: Date;
  updatedAt: Date;
};

type TeacherAttendanceRow = {
  status: string;
  date: Date;
};

const STATUS_MAP: Record<string, AttendanceStatus> = {
  PRESENT: 'PRESENT',
  ABSENT: 'ABSENT',
  LATE: 'LATE',
  LEAVE: 'LEAVE',
};

function convertStatus(status: string): ClientAttendanceStatus {
  switch (status) {
    case 'PRESENT':
      return 'present';
    case 'ABSENT':
      return 'absent';
    case 'LATE':
      return 'late';
    case 'LEAVE':
      return 'leave';
    default:
      return 'present';
  }
}

function toServerStatus(status: string): AttendanceStatus {
  const upper = status.toUpperCase();
  return STATUS_MAP[upper] ?? AttendanceStatus.PRESENT;
}

async function getPrimaryClass(teacherId: string): Promise<ClassWithStudents | null> {
  const classes = (await prisma.class.findMany({
    where: { teacherId },
    include: {
      students: {
        orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
      },
    },
    orderBy: { name: 'asc' },
  })) as ClassWithStudents[];

  if (!classes.length) {
    return null;
  }

  return classes[0];
}

export const teacherService = {
  async getDashboard(teacherId: string) {
    const primaryClass = await getPrimaryClass(teacherId);
    const today = new Date();
    const start = startOfDay(today);
    const end = endOfDay(today);

    if (!primaryClass) {
      return {
        date: formatISO(start, { representation: 'date' }),
        classId: null,
        className: null,
        totalStudents: 0,
        attendanceStatus: 'no-class',
        summary: { present: 0, absent: 0, late: 0, leave: 0 },
        submissions: [],
        quickActions: {
          lastSubmittedAt: null,
          nextClass: null,
          pendingStudents: 0,
          draftCount: 0,
        },
        notifications: [
          {
            id: 'no-class',
            message: 'No classes assigned. Contact the administrator for assistance.',
            type: 'info' as const,
            date: format(today, 'PPpp'),
          },
        ],
      };
    }

    const [todayRecords, drafts] = await Promise.all([
      prisma.attendanceRecord.findMany({
        where: {
          classId: primaryClass.id,
          recordedBy: teacherId,
          date: {
            gte: start,
            lte: end,
          },
        },
      }) as Promise<AttendanceRecordRow[]>,
      prisma.attendanceDraft.findMany({
        where: {
          teacherId,
          classId: primaryClass.id,
          date: start,
        },
      }) as Promise<AttendanceDraftRow[]>,
    ]);

    const recordMap = new Map<string, AttendanceRecordRow>(
      todayRecords.map((record: AttendanceRecordRow) => [record.studentId, record]),
    );
    const draftMap = new Map<string, AttendanceDraftRow>(
      drafts.map((draft: AttendanceDraftRow) => [draft.studentId, draft]),
    );

    const summary: Record<ClientAttendanceStatus, number> = {
      present: 0,
      absent: 0,
      late: 0,
      leave: 0,
    };

    const submissions = primaryClass.students.map((student: StudentRow) => {
      const record = recordMap.get(student.id);
      const draft = draftMap.get(student.id);
      const status = record
        ? convertStatus(record.status)
        : draft
          ? convertStatus(draft.status)
          : 'present';

      if (record) {
        summary[status] += 1;
      }

      return {
        studentId: student.id,
        studentName: `${student.firstName} ${student.lastName}`,
        status,
        hasRecord: Boolean(record),
        isDraft: Boolean(!record && draft),
        lastUpdated: record
          ? formatISO(record.recordedAt)
          : draft
            ? formatISO(draft.updatedAt)
            : null,
      };
    });

    // Count statuses using drafts when records missing
    if (todayRecords.length < primaryClass.students.length) {
      summary.present = submissions.filter((entry: DashboardSubmission) => entry.status === 'present').length;
      summary.absent = submissions.filter((entry: DashboardSubmission) => entry.status === 'absent').length;
      summary.late = submissions.filter((entry: DashboardSubmission) => entry.status === 'late').length;
      summary.leave = submissions.filter((entry: DashboardSubmission) => entry.status === 'leave').length;
    }

    const attendanceStatus = todayRecords.length === primaryClass.students.length
      ? 'submitted'
      : drafts.length > 0
        ? 'draft'
        : 'pending';

    const notifications = [] as Array<{ id: string; message: string; type: 'info' | 'warning'; date: string }>;
    if (attendanceStatus !== 'submitted') {
      notifications.push({
        id: 'attendance-reminder',
        message: `Attendance for ${primaryClass.name} is ${attendanceStatus}. Please review and submit.`,
        type: 'warning',
        date: format(today, 'PPpp'),
      });
    }

    if (!primaryClass.students.length) {
      notifications.push({
        id: 'no-students',
        message: 'No students are assigned to this class yet.',
        type: 'info',
        date: format(today, 'PPpp'),
      });
    }

    return {
      date: formatISO(start, { representation: 'date' }),
      classId: primaryClass.id,
      className: primaryClass.name,
      totalStudents: primaryClass.students.length,
      attendanceStatus,
      summary,
      submissions,
      quickActions: {
        lastSubmittedAt: (() => {
          if (!todayRecords.length) return null;
          let latest = todayRecords[0].recordedAt;
          for (const record of todayRecords) {
            if (record.recordedAt > latest) {
              latest = record.recordedAt;
            }
          }
          return formatISO(latest);
        })(),
        nextClass: format(end, "MMM d, yyyy 'at' 10:00 a"),
        pendingStudents: primaryClass.students.length - todayRecords.length,
        draftCount: drafts.length,
      },
      notifications,
    };
  },

  async saveAttendanceDraft(teacherId: string, classId: string, submissions: Array<{ studentId: string; status: string }>) {
    const date = startOfDay(new Date());
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.attendanceDraft.deleteMany({
        where: { teacherId, classId, date },
      });

      if (!submissions.length) {
        return;
      }

      await tx.attendanceDraft.createMany({
        data: submissions.map((submission) => ({
          teacherId,
          classId,
          studentId: submission.studentId,
          status: toServerStatus(submission.status),
          date,
        })),
      });
    });
  },

  async submitAttendance(teacherId: string, classId: string, submissions: Array<{ studentId: string; status: string }>) {
    const date = startOfDay(new Date());

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const timestamp = new Date();
      for (const submission of submissions) {
        await tx.attendanceRecord.upsert({
          where: {
            studentId_date: {
              studentId: submission.studentId,
              date,
            },
          },
          update: {
            status: toServerStatus(submission.status),
            recordedBy: teacherId,
            recordedAt: timestamp,
          },
          create: {
            studentId: submission.studentId,
            classId,
            status: toServerStatus(submission.status),
            recordedBy: teacherId,
            date,
            recordedAt: timestamp,
          },
        });
      }

      await tx.attendanceDraft.deleteMany({
        where: { teacherId, classId, date },
      });
    });
  },

  async getAttendanceHistory(teacherId: string, params: { startDate?: Date; endDate?: Date }) {
    const start = params.startDate ? startOfDay(params.startDate) : subDays(startOfDay(new Date()), 29);
    const end = params.endDate ? endOfDay(params.endDate) : endOfDay(new Date());

    const classes = (await prisma.class.findMany({
      where: { teacherId },
    })) as Array<{ id: string; name: string }>;

    if (!classes.length) {
      return {
        range: {
          startDate: formatISO(start, { representation: 'date' }),
          endDate: formatISO(end, { representation: 'date' }),
        },
        summaries: [],
        totals: { present: 0, absent: 0, late: 0, leave: 0 },
      };
    }

    const records = (await prisma.attendanceRecord.findMany({
      where: {
        classId: { in: classes.map((klass) => klass.id) },
        recordedBy: teacherId,
        date: {
          gte: start,
          lte: end,
        },
      },
    })) as AttendanceRecordRow[];

  const grouped = new Map<string, AttendanceHistorySummary>();

    for (const record of records) {
      const key = formatISO(record.date, { representation: 'date' });
      if (!grouped.has(key)) {
        grouped.set(key, {
          date: key,
          present: 0,
          absent: 0,
          late: 0,
          leave: 0,
          editable: differenceInCalendarDays(new Date(), record.date) <= ATTENDANCE_CUTOFF_DAYS,
        });
      }
      const summary = grouped.get(key)!;
      switch (record.status) {
        case 'PRESENT':
          summary.present += 1;
          break;
        case 'ABSENT':
          summary.absent += 1;
          break;
        case 'LATE':
          summary.late += 1;
          break;
        case 'LEAVE':
          summary.leave += 1;
          break;
        default:
          break;
      }
    }

    const summaries = Array.from(grouped.values()).sort((a, b) => (a.date > b.date ? -1 : 1));

    const totals = { present: 0, absent: 0, late: 0, leave: 0 };
    for (const summary of summaries) {
      totals.present += summary.present;
      totals.absent += summary.absent;
      totals.late += summary.late;
      totals.leave += summary.leave;
    }

    return {
      range: {
        startDate: formatISO(start, { representation: 'date' }),
        endDate: formatISO(end, { representation: 'date' }),
      },
      summaries,
      totals,
    };
  },

  async getAttendanceDetails(teacherId: string, date: Date) {
    const classes = (await prisma.class.findMany({
      where: { teacherId },
      include: {
        students: {
          orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
        },
      },
    })) as Array<ClassWithStudents>;

    if (!classes.length) {
      return [];
    }

    const start = startOfDay(date);
    const end = endOfDay(date);

    const records = (await prisma.attendanceRecord.findMany({
      where: {
        classId: { in: classes.map((klass) => klass.id) },
        date: {
          gte: start,
          lte: end,
        },
      },
    })) as AttendanceRecordRow[];

    const recordMap = new Map<string, AttendanceRecordRow>(
      records.map((record: AttendanceRecordRow) => [record.studentId, record]),
    );

    return classes.map((klass: ClassWithStudents) => ({
      classId: klass.id,
      className: klass.name,
      submissions: klass.students.map((student: StudentRow) => {
        const record = recordMap.get(student.id);
        return {
          studentId: student.id,
          studentName: `${student.firstName} ${student.lastName}`,
          status: record ? convertStatus(record.status) : 'present',
        };
      }),
      editable: differenceInCalendarDays(new Date(), date) <= ATTENDANCE_CUTOFF_DAYS,
    }));
  },

  async updateAttendanceByDate(teacherId: string, classId: string, date: Date, submissions: Array<{ studentId: string; status: string }>) {
    const cutoffExceeded = differenceInCalendarDays(new Date(), date) > ATTENDANCE_CUTOFF_DAYS;
    if (cutoffExceeded) {
      throw new Error('Editing window has expired for this entry');
    }

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      for (const submission of submissions) {
        await tx.attendanceRecord.upsert({
          where: {
            studentId_date: {
              studentId: submission.studentId,
              date: startOfDay(date),
            },
          },
          update: {
            status: toServerStatus(submission.status),
            recordedBy: teacherId,
          },
          create: {
            studentId: submission.studentId,
            classId,
            status: toServerStatus(submission.status),
            recordedBy: teacherId,
            date: startOfDay(date),
          },
        });
      }
    });
  },

  async getStudentInsights(teacherId: string) {
    const classes = (await prisma.class.findMany({
      where: { teacherId },
      include: {
        students: true,
      },
    })) as Array<ClassWithStudents>;

    if (!classes.length) {
      return {
        period: {
          startDate: formatISO(subDays(startOfDay(new Date()), 29), { representation: 'date' }),
          endDate: formatISO(startOfDay(new Date()), { representation: 'date' }),
        },
        lowAttendanceStudents: [],
        consecutiveAbsences: [],
      };
    }

    const students = classes.flatMap((klass: ClassWithStudents) =>
      klass.students.map((student: StudentRow) => ({ ...student, className: klass.name })),
    );

    const start = subDays(startOfDay(new Date()), 29);
    const end = endOfDay(new Date());

    const records = (await prisma.attendanceRecord.findMany({
      where: {
        studentId: { in: students.map((student) => student.id) },
        date: {
          gte: start,
          lte: end,
        },
      },
      orderBy: { date: 'asc' },
    })) as AttendanceRecordRow[];

    const studentRecords = new Map<string, AttendanceRecordRow[]>();

    for (const record of records) {
      if (!studentRecords.has(record.studentId)) {
        studentRecords.set(record.studentId, []);
      }
      studentRecords.get(record.studentId)!.push(record);
    }

    const lowAttendanceStudents = [] as Array<{
      studentId: string;
      studentName: string;
      className: string;
      attendanceRate: number;
      present: number;
      total: number;
    }>;

    const consecutiveAbsences = [] as Array<{
      studentId: string;
      studentName: string;
      className: string;
      streak: number;
      lastAbsentDate: string | null;
    }>;

    for (const student of students) {
      const entries = studentRecords.get(student.id) ?? [];
      if (!entries.length) continue;

      const present = entries.filter((entry) => entry.status === 'PRESENT').length;
      const total = entries.length;
      const attendanceRate = total ? Math.round((present / total) * 100) : 100;

      if (attendanceRate < 75) {
        lowAttendanceStudents.push({
          studentId: student.id,
          studentName: `${student.firstName} ${student.lastName}`,
          className: student.className,
          attendanceRate,
          present,
          total,
        });
      }

      let streak = 0;
      let lastAbsentDate: string | null = null;

      for (let index = entries.length - 1; index >= 0; index -= 1) {
        const entry = entries[index];
        if (entry.status === 'ABSENT') {
          streak += 1;
          if (!lastAbsentDate) {
            lastAbsentDate = formatISO(entry.date, { representation: 'date' });
          }
        } else {
          break;
        }
      }

      if (streak >= 2) {
        consecutiveAbsences.push({
          studentId: student.id,
          studentName: `${student.firstName} ${student.lastName}`,
          className: student.className,
          streak,
          lastAbsentDate,
        });
      }
    }

    lowAttendanceStudents.sort((a, b) => a.attendanceRate - b.attendanceRate);
    consecutiveAbsences.sort((a, b) => b.streak - a.streak);

    return {
      period: {
        startDate: formatISO(start, { representation: 'date' }),
        endDate: formatISO(end, { representation: 'date' }),
      },
      lowAttendanceStudents,
      consecutiveAbsences,
    };
  },

  async getClassAnalytics(teacherId: string) {
    const classes = (await prisma.class.findMany({
      where: { teacherId },
    })) as Array<{ id: string; name: string }>;

    if (!classes.length) {
      return {
        weeklyTrend: [],
        monthlyTrend: [],
        peakAbsenceDays: [],
      };
    }

  const classIds = classes.map((klass) => klass.id);
    const start = subDays(startOfDay(new Date()), 89);
    const end = endOfDay(new Date());

    const records = (await prisma.attendanceRecord.findMany({
      where: {
        classId: { in: classIds },
        date: {
          gte: start,
          lte: end,
        },
      },
    })) as AttendanceRecordRow[];

    const schoolRecords = (await prisma.attendanceRecord.findMany({
      where: {
        date: {
          gte: start,
          lte: end,
        },
      },
    })) as AttendanceRecordRow[];

    const weeklyTrend: Array<{ week: string; classRate: number; schoolRate: number }> = [];
    const monthlyTrend: Array<{ month: string; classRate: number; schoolRate: number }> = [];

    const calculateRate = (entries: AttendanceRecordRow[]) => {
      if (!entries.length) return 0;
      const present = entries.filter((entry) => entry.status === 'PRESENT').length;
      return Math.round((present / entries.length) * 100);
    };

    for (let weekOffset = 0; weekOffset < 12; weekOffset += 1) {
      const weekEnd = endOfDay(subDays(end, weekOffset * 7));
      const weekStart = subDays(weekEnd, 6);

  const classEntries = records.filter((entry) => isWithinInterval(entry.date, { start: weekStart, end: weekEnd }));
  const schoolEntries = schoolRecords.filter((entry) => isWithinInterval(entry.date, { start: weekStart, end: weekEnd }));

      weeklyTrend.unshift({
        week: `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d')}`,
        classRate: calculateRate(classEntries),
        schoolRate: calculateRate(schoolEntries),
      });
    }

    for (let monthOffset = 0; monthOffset < 4; monthOffset += 1) {
      const monthEnd = endOfDay(subDays(end, monthOffset * 30));
      const monthStart = subDays(monthEnd, 29);

  const classEntries = records.filter((entry) => isWithinInterval(entry.date, { start: monthStart, end: monthEnd }));
  const schoolEntries = schoolRecords.filter((entry) => isWithinInterval(entry.date, { start: monthStart, end: monthEnd }));

      monthlyTrend.unshift({
        month: `${format(monthStart, 'MMM d')} - ${format(monthEnd, 'MMM d')}`,
        classRate: calculateRate(classEntries),
        schoolRate: calculateRate(schoolEntries),
      });
    }

    const absenceMap = new Map<string, number>();

    for (const record of records) {
      if (record.status === 'ABSENT') {
        const key = formatISO(record.date, { representation: 'date' });
        absenceMap.set(key, (absenceMap.get(key) ?? 0) + 1);
      }
    }

    const peakAbsenceDays = Array.from(absenceMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      weeklyTrend,
      monthlyTrend,
      peakAbsenceDays,
    };
  },

  async getNotifications(teacherId: string) {
    const dashboard = await this.getDashboard(teacherId);
    return dashboard.notifications;
  },

  async getProfile(teacherId: string) {
    const teacher = await prisma.user.findUnique({
      where: { id: teacherId },
      include: {
        classes: {
          include: {
            students: true,
          },
        },
      },
    });

    if (!teacher) {
      throw new Error('Teacher not found');
    }

    const start = subDays(startOfDay(new Date()), 29);
    const end = endOfDay(new Date());

    const teacherAttendance = (await prisma.teacherAttendance.findMany({
      where: {
        teacherId,
        date: {
          gte: start,
          lte: end,
        },
      },
    })) as TeacherAttendanceRow[];

    const summary = { total: 0, present: 0, absent: 0, late: 0, leave: 0 };
    for (const record of teacherAttendance) {
      switch (record.status) {
        case 'PRESENT':
          summary.present += 1;
          break;
        case 'ABSENT':
          summary.absent += 1;
          break;
        case 'LATE':
          summary.late += 1;
          break;
        case 'LEAVE':
          summary.leave += 1;
          break;
        default:
          break;
      }
      summary.total += 1;
    }

    const attendanceRate = summary.total ? Math.round((summary.present / summary.total) * 100) : 100;

    return {
      teacher: {
        id: teacher.id,
        name: `${teacher.firstName} ${teacher.lastName}`,
        email: teacher.email,
      },
      classes: teacher.classes.map((klass: { id: string; name: string; gradeLevel?: string | null; students: StudentRow[] }) => ({
        id: klass.id,
        name: klass.name,
        gradeLevel: klass.gradeLevel,
        studentCount: klass.students.length,
      })),
      attendanceSummary: {
        ...summary,
        attendanceRate,
      },
    };
  },

  async getClassStudents(teacherId: string, classId: string) {
    const klass = (await prisma.class.findFirst({
      where: { id: classId, teacherId },
      include: {
        students: {
          orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
        },
      },
    })) as (ClassWithStudents & { id: string }) | null;

    if (!klass) {
      throw new AppError('Class not found', StatusCodes.NOT_FOUND);
    }

    return klass.students.map<StudentRosterEntry>((student) => ({
      id: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
      classId: klass.id,
    }));
  },
};
