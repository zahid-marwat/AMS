import type { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { verifyAccessToken } from '@/utils/jwt';
import { AppError } from '@/utils/appError';

type AllowedRoles = Array<'ADMIN' | 'TEACHER'>;

export function authenticate(allowedRoles?: AllowedRoles) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;

    if (!token) {
      throw new AppError('Authentication required', StatusCodes.UNAUTHORIZED);
    }

    try {
      const payload = verifyAccessToken(token);
      if (allowedRoles && !allowedRoles.includes(payload.role)) {
        throw new AppError('Forbidden', StatusCodes.FORBIDDEN);
      }

      req.userId = payload.sub;
      req.userRole = payload.role;
      next();
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Invalid or expired token', StatusCodes.UNAUTHORIZED);
    }
  };
}
