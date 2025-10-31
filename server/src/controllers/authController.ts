import type { Request, Response, NextFunction } from 'express';
import { authService } from '@/services/authService';

export const authController = {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      
      // Set refresh token as httpOnly cookie
      // Note: In development, secure is set to false for localhost testing
      // In production, this will be true for HTTPS
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // true in production (HTTPS), false in dev (HTTP)
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });

      res.json({
        accessToken: result.accessToken,
        user: result.user,
      });
    } catch (error) {
      next(error);
    }
  },

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.cookies;
      if (!refreshToken) {
        res.status(401).json({ message: 'Refresh token required' });
        return;
      }

      const result = await authService.refresh(refreshToken);
      res.json({ accessToken: result.accessToken });
    } catch (error) {
      next(error);
    }
  },

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.cookies;
      if (refreshToken) {
        await authService.revokeRefreshToken(refreshToken);
      }
      
      res.clearCookie('refreshToken');
      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      next(error);
    }
  },

  async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId;
      if (!userId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      const user = await authService.getCurrentUser(userId);
      res.json(user);
    } catch (error) {
      next(error);
    }
  },
};
