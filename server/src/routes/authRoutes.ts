import { Router } from 'express';
import { authController } from '@/controllers/authController';
import { authenticate } from '@/middlewares/authenticate';

const router = Router();

router.post('/login', authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.get('/me', authenticate(), authController.getMe);

export default router;
