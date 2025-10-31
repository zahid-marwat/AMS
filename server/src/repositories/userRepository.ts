import { prisma } from '@/lib/prisma';
import { Role } from '@/types/enums';

export const userRepository = {
  findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  },

  findById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  },

  listTeachers() {
    return prisma.user.findMany({
      where: { role: Role.TEACHER },
      include: {
        classes: true,
      },
      orderBy: { lastName: 'asc' },
    });
  },

  createTeacher(data: { email: string; passwordHash: string; firstName: string; lastName: string }) {
    return prisma.user.create({
      data: {
        ...data,
        role: Role.TEACHER,
      },
    });
  },

  createAdmin(data: { email: string; passwordHash: string; firstName: string; lastName: string }) {
    return prisma.user.create({
      data: {
        ...data,
        role: Role.ADMIN,
      },
    });
  },
};
