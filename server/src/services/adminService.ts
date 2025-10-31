import { subDays, formatISO } from 'date-fns';
import { prisma } from '@/lib/prisma';
import { AttendanceStatus, Role } from '@/types/enums';
import { hashPassword } from '@/utils/password';

// Helper function to get weekdays only (Monday to Friday)
function getWeekdaysBack(fromDate: Date, count: number): Date {
  let date = new Date(fromDate);
  let weekdaysFound = 0;
  
  while (weekdaysFound < count) {
    date = subDays(date, 1);
    const dayOfWeek = date.getDay();
    // 0 = Sunday, 6 = Saturday
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      weekdaysFound++;
    }
  }
  
  return date;
}

function buildDailyBuckets(days: number) {
  const buckets: Record<string, { present: number; absent: number }> = {};
  for (let i = 0; i < days; i += 1) {
    const date = subDays(new Date(), i);
    buckets[formatISO(date, { representation: 'date' })] = { present: 0, absent: 0 };
  }
  return buckets;
}

export const adminService = {
  async getOverview() {
    const studentCount = await prisma.student.count();
    const classList = await prisma.class.findMany({
      include: { students: true, attendance: true, teacher: true },
    });
    type ClassWithRelations = (typeof classList)[number];
    type ClassAttendanceRecord = ClassWithRelations['attendance'][number];

    const teacherList = await prisma.user.findMany({
      where: { role: Role.TEACHER },
      include: { classes: { include: { students: true } } },
    });
    type TeacherWithClasses = (typeof teacherList)[number];

    const attendanceRecords = await prisma.attendanceRecord.findMany({
      where: { date: { gte: subDays(new Date(), 14) } },
    });
    type RecentAttendanceRecord = (typeof attendanceRecords)[number];

    const attendanceBuckets = buildDailyBuckets(14);
    attendanceRecords.forEach((record: RecentAttendanceRecord) => {
      const key = formatISO(record.date, { representation: 'date' });
      const bucket = attendanceBuckets[key];
      if (!bucket) return;
      if (record.status === AttendanceStatus.PRESENT) {
        bucket.present += 1;
      } else {
        bucket.absent += 1;
      }
    });

    const distribution = classList.map((klass: ClassWithRelations) => {
      const total = klass.students.length || 1;
      const presentRecords = klass.attendance.filter(
        (entry: ClassAttendanceRecord) => entry.status === AttendanceStatus.PRESENT,
      );
      const rate = presentRecords.length / klass.attendance.length || 0;
      return {
        id: klass.id,
        name: klass.name,
        students: klass.students.length,
        attendance: Math.round(rate * 100),
        gradeLevel: klass.gradeLevel,
        teacherName: klass.teacher ? `${klass.teacher.firstName} ${klass.teacher.lastName}` : null,
      };
    });

    const totalAttendance = attendanceRecords.length || 1;
    const presentAttendance = attendanceRecords.filter(
      (record: RecentAttendanceRecord) => record.status === AttendanceStatus.PRESENT,
    );

    return {
      students: {
        total: studentCount,
        delta: 0,
      },
      attendance: {
        rate: presentAttendance.length / totalAttendance,
        history: Object.entries(attendanceBuckets)
          .map(([date, values]) => ({ date, present: values.present, absent: values.absent }))
          .sort((a, b) => a.date.localeCompare(b.date)),
      },
      teachers: {
        coverage: `${teacherList.filter((teacher: TeacherWithClasses) => teacher.classes.length > 0).length}/${teacherList.length}`,
      },
      classes: {
        distribution,
      },
    };
  },

  async listClasses() {
    const classes = await prisma.class.findMany({
      include: { students: true, teacher: true, attendance: true },
    });
    type ClassWithRelations = (typeof classes)[number];
    type ClassAttendanceRecord = ClassWithRelations['attendance'][number];

    return classes.map((klass: ClassWithRelations) => ({
      id: klass.id,
      name: klass.name,
      gradeLevel: klass.gradeLevel,
      teacherName: klass.teacher ? `${klass.teacher.firstName} ${klass.teacher.lastName}` : null,
      studentCount: klass.students.length,
      attendanceRate:
        klass.attendance.length === 0
          ? 0
          :
            klass.attendance.filter(
              (entry: ClassAttendanceRecord) =>
                entry.status === AttendanceStatus.PRESENT,
            ).length / klass.attendance.length,
    }));
  },

  listStudents() {
    return prisma.student.findMany({
      include: {
        class: true,
      },
      orderBy: { lastName: 'asc' },
    });
  },

  async listTeachers() {
    const teachers = await prisma.user.findMany({
      where: { role: Role.TEACHER },
      include: { 
        classes: {
          include: {
            students: true
          }
        }
      },
      orderBy: { lastName: 'asc' },
    });

    type TeacherWithClasses = (typeof teachers)[number];

    return teachers.map((teacher: TeacherWithClasses) => ({
      id: teacher.id,
      firstName: teacher.firstName,
      lastName: teacher.lastName,
      email: teacher.email,
      assignedClasses: teacher.classes.map((klass: TeacherWithClasses['classes'][number]) => ({
        id: klass.id,
        name: klass.name,
        gradeLevel: klass.gradeLevel,
        studentCount: klass.students.length,
      })),
    }));
  },

  async recordClass(payload: { name: string; gradeLevel: string; teacherId?: string | null }) {
    return prisma.class.create({ data: payload });
  },

  async updateClass(classId: string, payload: { name?: string; gradeLevel?: string; teacherId?: string | null }) {
    return prisma.class.update({
      where: { id: classId },
      data: payload,
      include: {
        teacher: true,
        students: true,
      },
    });
  },

  async deleteClass(classId: string) {
    // Delete all attendance records for this class
    await prisma.attendanceRecord.deleteMany({ where: { classId } });
    // Delete all students in this class (or you could reassign them)
    await prisma.student.deleteMany({ where: { classId } });
    // Delete the class
    return prisma.class.delete({ where: { id: classId } });
  },

  async createStudent(payload: { firstName: string; lastName: string; classId: string }) {
    return prisma.student.create({ data: payload });
  },

  async updateStudent(studentId: string, payload: { firstName?: string; lastName?: string; classId?: string }) {
    return prisma.student.update({
      where: { id: studentId },
      data: payload,
      include: {
        class: true,
      },
    });
  },

  async createTeacher(payload: { firstName: string; lastName: string; email: string; password: string }) {
    const passwordHash = await hashPassword(payload.password);
    
    return prisma.user.create({
      data: {
        firstName: payload.firstName,
        lastName: payload.lastName,
        email: payload.email,
        passwordHash: passwordHash,
        role: Role.TEACHER,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
      },
    });
  },

  async deleteStudent(studentId: string) {
    await prisma.attendanceRecord.deleteMany({ where: { studentId } });
    return prisma.student.delete({ where: { id: studentId } });
  },

  async getAttendanceForClass(classId: string) {
    const records = await prisma.attendanceRecord.findMany({
      where: { classId },
      orderBy: { date: 'desc' },
    });

    type ClassAttendanceSnapshot = (typeof records)[number];

    return records.map((record: ClassAttendanceSnapshot) => ({
      date: formatISO(record.date, { representation: 'date' }),
      present: record.status === AttendanceStatus.PRESENT ? 1 : 0,
      absent: record.status === AttendanceStatus.ABSENT ? 1 : 0,
      late: record.status === AttendanceStatus.LATE ? 1 : 0,
      leave: record.status === AttendanceStatus.LEAVE ? 1 : 0,
    }));
  },

  async getAttendanceSummary(classId: string, params: { startDate?: Date; endDate?: Date; period?: 'daily' | 'weekly' | 'monthly' | 'yearly' }) {
    const { startDate, endDate, period = 'daily' } = params;
    
    // Calculate date range based on period
    let start = startDate;
    let end = endDate || new Date();
    // Set end to start of day to include today's records
    end.setHours(23, 59, 59, 999);
    
    if (!start) {
      switch (period) {
        case 'daily':
          // Present day only
          start = new Date(end);
          start.setHours(0, 0, 0, 0);
          break;
        case 'weekly':
          // Last 6 weekdays (Monday to Friday)
          start = getWeekdaysBack(end, 6);
          start.setHours(0, 0, 0, 0);
          break;
        case 'monthly':
          // Last 30 weekdays (Monday to Friday)
          start = getWeekdaysBack(end, 30);
          start.setHours(0, 0, 0, 0);
          break;
        case 'yearly':
          // Last 365 days of weekdays (Monday to Friday)
          start = getWeekdaysBack(end, 365);
          start.setHours(0, 0, 0, 0);
          break;
      }
    }

    const records = await prisma.attendanceRecord.findMany({
      where: { 
        classId,
        date: {
          gte: start,
          lte: end,
        }
      },
      include: {
        student: true,
      },
      orderBy: { date: 'desc' },
    });

    type AttendanceWithStudent = (typeof records)[number];

    // Get class info for the records
    const classInfo = await prisma.class.findUnique({
      where: { id: classId },
      select: { name: true },
    });

    // Calculate overall summary
    const summary = {
      total: records.length,
      present: records.filter((r: AttendanceWithStudent) => r.status === AttendanceStatus.PRESENT).length,
      absent: records.filter((r: AttendanceWithStudent) => r.status === AttendanceStatus.ABSENT).length,
      late: records.filter((r: AttendanceWithStudent) => r.status === AttendanceStatus.LATE).length,
      leave: records.filter((r: AttendanceWithStudent) => r.status === AttendanceStatus.LEAVE).length,
    };

    // Group by student for individual breakdown
    const studentMap = new Map<string, {
      id: string;
      name: string;
      present: number;
      absent: number;
      late: number;
      leave: number;
      total: number;
    }>();

    records.forEach((record: AttendanceWithStudent) => {
      const key = record.studentId;
      if (!studentMap.has(key)) {
        studentMap.set(key, {
          id: record.student.id,
          name: `${record.student.firstName} ${record.student.lastName}`,
          present: 0,
          absent: 0,
          late: 0,
          leave: 0,
          total: 0,
        });
      }
      const stats = studentMap.get(key)!;
      stats.total += 1;
      if (record.status === AttendanceStatus.PRESENT) stats.present += 1;
      else if (record.status === AttendanceStatus.ABSENT) stats.absent += 1;
      else if (record.status === AttendanceStatus.LATE) stats.late += 1;
      else if (record.status === AttendanceStatus.LEAVE) stats.leave += 1;
    });

    // Create detailed records with student name, class name, and date
    const detailedRecords = records.map((record: AttendanceWithStudent) => ({
      id: record.id,
      studentId: record.studentId,
      studentName: `${record.student.firstName} ${record.student.lastName}`,
      className: classInfo?.name || 'Unknown',
      status: record.status,
      date: formatISO(record.date, { representation: 'date' }),
    }));

    return {
      period,
      startDate: formatISO(start, { representation: 'date' }),
      endDate: formatISO(end, { representation: 'date' }),
      summary,
      students: Array.from(studentMap.values()).sort((a, b) => a.name.localeCompare(b.name)),
      records: detailedRecords,
    };
  },

  async getTeacherDetail(teacherId: string, params: { startDate?: Date; endDate?: Date; period?: 'daily' | 'weekly' | 'monthly' | 'yearly' }) {
    const { startDate, endDate, period = 'monthly' } = params;

    // Calculate date range
    let start: Date;
    let end: Date = endDate || new Date();
    // Set end to end of day to include today's records
    end.setHours(23, 59, 59, 999);

    if (startDate) {
      start = startDate;
    } else {
      switch (period) {
        case 'daily':
          // Present day only
          start = new Date(end);
          start.setHours(0, 0, 0, 0);
          break;
        case 'weekly':
          // Last 6 weekdays (Monday to Friday)
          start = getWeekdaysBack(end, 6);
          start.setHours(0, 0, 0, 0);
          break;
        case 'monthly':
          // Last 30 weekdays (Monday to Friday)
          start = getWeekdaysBack(end, 30);
          start.setHours(0, 0, 0, 0);
          break;
        case 'yearly':
          // Last 365 days of weekdays (Monday to Friday)
          start = getWeekdaysBack(end, 365);
          start.setHours(0, 0, 0, 0);
          break;
        default:
          start = getWeekdaysBack(end, 30);
          start.setHours(0, 0, 0, 0);
      }
    }

    // Get teacher with classes
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

    // Get teacher's own attendance
    const teacherAttendance = await prisma.teacherAttendance.findMany({
      where: {
        teacherId,
        date: {
          gte: start,
          lte: end,
        },
      },
    });

    // Calculate teacher attendance summary
    const attendanceSummary = {
      total: teacherAttendance.length,
      present: teacherAttendance.filter((a: { status: string }) => a.status === 'PRESENT').length,
      absent: teacherAttendance.filter((a: { status: string }) => a.status === 'ABSENT').length,
      late: teacherAttendance.filter((a: { status: string }) => a.status === 'LATE').length,
      leave: teacherAttendance.filter((a: { status: string }) => a.status === 'LEAVE').length,
    };

    return {
      teacher: {
        id: teacher.id,
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        email: teacher.email,
      },
      classes: teacher.classes.map((c: { id: string; name: string; gradeLevel: string; students: unknown[] }) => ({
        id: c.id,
        name: c.name,
        gradeLevel: c.gradeLevel,
        studentCount: c.students.length,
      })),
      attendance: attendanceSummary,
      period,
      startDate: formatISO(start, { representation: 'date' }),
      endDate: formatISO(end, { representation: 'date' }),
    };
  },

  async getSchoolAttendanceSummary(params: { startDate?: Date; endDate?: Date; period?: 'daily' | 'weekly' | 'monthly' | 'yearly' }) {
    const { startDate, endDate, period = 'daily' } = params;
    
    // Calculate date range based on period
    let start = startDate;
    let end = endDate || new Date();
    // Set end to end of day to include today's records
    end.setHours(23, 59, 59, 999);
    
    if (!start) {
      switch (period) {
        case 'daily':
          // Present day only
          start = new Date(end);
          start.setHours(0, 0, 0, 0);
          break;
        case 'weekly':
          // Last 6 weekdays (Monday to Friday)
          start = getWeekdaysBack(end, 6);
          start.setHours(0, 0, 0, 0);
          break;
        case 'monthly':
          // Last 30 weekdays (Monday to Friday)
          start = getWeekdaysBack(end, 30);
          start.setHours(0, 0, 0, 0);
          break;
        case 'yearly':
          // Last 365 days of weekdays (Monday to Friday)
          start = getWeekdaysBack(end, 365);
          start.setHours(0, 0, 0, 0);
          break;
      }
    }

    // Get all attendance records for the date range
    const records = await prisma.attendanceRecord.findMany({
      where: { 
        date: {
          gte: start,
          lte: end,
        }
      },
      include: {
        student: true,
        class: true,
      },
      orderBy: { date: 'desc' },
    });

    type AttendanceWithRelations = (typeof records)[number];

    // Calculate overall summary
    const summary = {
      total: records.length,
      present: records.filter((r: AttendanceWithRelations) => r.status === AttendanceStatus.PRESENT).length,
      absent: records.filter((r: AttendanceWithRelations) => r.status === AttendanceStatus.ABSENT).length,
      late: records.filter((r: AttendanceWithRelations) => r.status === AttendanceStatus.LATE).length,
      leave: records.filter((r: AttendanceWithRelations) => r.status === AttendanceStatus.LEAVE).length,
    };

    // Group by class for breakdown
    const classMap = new Map<string, {
      id: string;
      name: string;
      present: number;
      absent: number;
      late: number;
      leave: number;
      total: number;
    }>();

    records.forEach((record: AttendanceWithRelations) => {
      const classId = record.classId;
      const className = record.class.name;
      
      if (!classMap.has(classId)) {
        classMap.set(classId, {
          id: classId,
          name: className,
          present: 0,
          absent: 0,
          late: 0,
          leave: 0,
          total: 0,
        });
      }

      const classData = classMap.get(classId)!;
      classData.total += 1;

      if (record.status === AttendanceStatus.PRESENT) classData.present += 1;
      else if (record.status === AttendanceStatus.ABSENT) classData.absent += 1;
      else if (record.status === AttendanceStatus.LATE) classData.late += 1;
      else if (record.status === AttendanceStatus.LEAVE) classData.leave += 1;
    });

    // Create detailed records with student name, class name, and date
    const detailedRecords = records.map((record: AttendanceWithRelations) => ({
      id: record.id,
      studentId: record.studentId,
      studentName: `${record.student.firstName} ${record.student.lastName}`,
      className: record.class.name,
      status: record.status,
      date: formatISO(record.date, { representation: 'date' }),
    }));

    return {
      period,
      startDate: formatISO(start, { representation: 'date' }),
      endDate: formatISO(end, { representation: 'date' }),
      summary,
      classes: Array.from(classMap.values()).sort((a, b) => a.name.localeCompare(b.name)),
      records: detailedRecords,
    };
  },

  async getStudentDailyAttendance(params: { classId?: string; startDate?: Date; endDate?: Date; period?: 'daily' | 'weekly' | 'monthly' | 'yearly' }) {
    const { classId, startDate, endDate, period = 'weekly' } = params;
    
    // Calculate date range based on period
    let start = startDate;
    let end = endDate || new Date();
    // Set end to end of day to include today's records
    end.setHours(23, 59, 59, 999);
    
    if (!start) {
      switch (period) {
        case 'daily':
          // Present day only
          start = new Date(end);
          start.setHours(0, 0, 0, 0);
          break;
        case 'weekly':
          // Last 6 weekdays (Monday to Friday)
          start = getWeekdaysBack(end, 6);
          start.setHours(0, 0, 0, 0);
          break;
        case 'monthly':
          // Last 30 weekdays (Monday to Friday)
          start = getWeekdaysBack(end, 30);
          start.setHours(0, 0, 0, 0);
          break;
        case 'yearly':
          // Last 365 days of weekdays (Monday to Friday)
          start = getWeekdaysBack(end, 365);
          start.setHours(0, 0, 0, 0);
          break;
      }
    }

    // Build query filter
    const whereClause: { date: { gte: Date; lte: Date }; classId?: string } = {
      date: {
        gte: start,
        lte: end,
      },
    };

    if (classId) {
      whereClause.classId = classId;
    }

    // Get all attendance records
    const records = await prisma.attendanceRecord.findMany({
      where: whereClause,
      include: {
        student: true,
        class: true,
      },
      orderBy: [
        { date: 'desc' },
        { student: { firstName: 'asc' } },
      ],
    });

    type AttendanceWithRelations = (typeof records)[number];

    // Group by student
    const studentMap = new Map<string, {
      id: string;
      name: string;
      className: string;
      classId: string;
      dailyRecords: Array<{
        date: string;
        status: string;
      }>;
      summary: {
        present: number;
        absent: number;
        late: number;
        leave: number;
        total: number;
      };
    }>();

    records.forEach((record: AttendanceWithRelations) => {
      const studentId = record.studentId;
      const studentName = `${record.student.firstName} ${record.student.lastName}`;
      
      if (!studentMap.has(studentId)) {
        studentMap.set(studentId, {
          id: studentId,
          name: studentName,
          className: record.class.name,
          classId: record.classId,
          dailyRecords: [],
          summary: {
            present: 0,
            absent: 0,
            late: 0,
            leave: 0,
            total: 0,
          },
        });
      }

      const studentData = studentMap.get(studentId)!;
      
      // Add daily record
      studentData.dailyRecords.push({
        date: formatISO(record.date, { representation: 'date' }),
        status: record.status,
      });

      // Update summary
      studentData.summary.total += 1;
      if (record.status === AttendanceStatus.PRESENT) studentData.summary.present += 1;
      else if (record.status === AttendanceStatus.ABSENT) studentData.summary.absent += 1;
      else if (record.status === AttendanceStatus.LATE) studentData.summary.late += 1;
      else if (record.status === AttendanceStatus.LEAVE) studentData.summary.leave += 1;
    });

    return {
      period,
      startDate: formatISO(start, { representation: 'date' }),
      endDate: formatISO(end, { representation: 'date' }),
      students: Array.from(studentMap.values()).sort((a, b) => a.name.localeCompare(b.name)),
    };
  },
};
