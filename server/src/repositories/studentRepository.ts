import { prisma } from '@/lib/prisma';

export const studentRepository = {
  list() {
    return prisma.student.findMany({ orderBy: { lastName: 'asc' } });
  },

  listByClass(classId: string) {
    return prisma.student.findMany({
      where: { classId },
      orderBy: { lastName: 'asc' },
    });
  },

  upsert(data: { id?: string; firstName: string; lastName: string; classId: string }) {
    if (data.id) {
      const { id, ...rest } = data;
      return prisma.student.update({ where: { id }, data: rest });
    }

    return prisma.student.create({ data });
  },

  remove(id: string) {
    return prisma.student.delete({ where: { id } });
  },
};
