import { prisma } from '@/lib/prisma';

export const classRepository = {
  list() {
    return prisma.class.findMany({
      include: {
        teacher: true,
        students: true,
        attendance: true,
      },
      orderBy: { name: 'asc' },
    });
  },

  create(data: { name: string; gradeLevel: string; teacherId?: string | null }) {
    return prisma.class.create({ data });
  },

  update(id: string, data: { name?: string; gradeLevel?: string; teacherId?: string | null }) {
    return prisma.class.update({ where: { id }, data });
  },

  findById(id: string) {
    return prisma.class.findUnique({
      where: { id },
      include: { students: true, attendance: true, teacher: true },
    });
  },
};
