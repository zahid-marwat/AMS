import { StatusCodes } from 'http-status-codes';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';
import { userRepository } from '@/repositories/userRepository';
import { comparePassword, hashPassword } from '@/utils/password';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '@/utils/jwt';
import { AppError } from '@/utils/appError';
import { Role } from '@/types/enums';

export const authService = {
  async login(email: string, password: string) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new AppError('Invalid credentials', StatusCodes.UNAUTHORIZED);
    }

    const isValid = await comparePassword(password, user.passwordHash);
    if (!isValid) {
      throw new AppError('Invalid credentials', StatusCodes.UNAUTHORIZED);
    }

    const accessToken = signAccessToken({ sub: user.id, role: user.role as 'ADMIN' | 'TEACHER' });
    const refreshToken = signRefreshToken({ sub: user.id, role: user.role as 'ADMIN' | 'TEACHER' });
    const decoded = jwt.decode(refreshToken) as jwt.JwtPayload;

    let assignedClassIds: string[] | undefined;
    if (user.role === Role.TEACHER) {
      const classes = await prisma.class.findMany({
        where: { teacherId: user.id },
        select: { id: true },
      });
      assignedClassIds = classes.map((klass) => klass.id);
    }

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date((decoded.exp ?? 0) * 1000),
      },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        assignedClassIds,
      },
      accessToken,
      refreshToken,
    };
  },

  async registerAdmin(payload: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) {
    const existing = await userRepository.findByEmail(payload.email);
    if (existing) {
      throw new AppError('Email already in use', StatusCodes.CONFLICT);
    }

    const passwordHash = await hashPassword(payload.password);
    const user = await userRepository.createAdmin({ ...payload, passwordHash });
    return user;
  },

  async refresh(token: string) {
    const stored = await prisma.refreshToken.findUnique({ where: { token } });
    if (!stored) {
      throw new AppError('Invalid refresh token', StatusCodes.UNAUTHORIZED);
    }

    const payload = verifyRefreshToken(token);

    const accessToken = signAccessToken(payload);
    const newRefreshToken = signRefreshToken(payload);
    const decoded = jwt.decode(newRefreshToken) as jwt.JwtPayload;

    await prisma.$transaction([
      prisma.refreshToken.delete({ where: { token } }),
      prisma.refreshToken.create({
        data: {
          token: newRefreshToken,
          userId: payload.sub,
          expiresAt: new Date((decoded.exp ?? 0) * 1000),
        },
      }),
    ]);

    return { accessToken, refreshToken: newRefreshToken };
  },

  async revokeRefreshToken(token: string) {
    await prisma.refreshToken.deleteMany({ where: { token } });
  },

  async getCurrentUser(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError('User not found', StatusCodes.NOT_FOUND);
    }

    if (user.role === Role.TEACHER) {
      const classes = await prisma.class.findMany({
        where: { teacherId: user.id },
        select: { id: true },
      });

      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        assignedClassIds: classes.map((klass: { id: string }) => klass.id),
      };
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    };
  },
};
