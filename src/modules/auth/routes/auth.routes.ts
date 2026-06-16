import { Router } from 'express';
import { authRateLimiter } from '../../../middlewares/rate-limit.middleware';
import { validateBody } from '../../../middlewares/validate.middleware';
import { loginSchema, refreshTokenSchema, registerSchema } from '../../../shared/validation';
import { AuthController } from '../controllers/auth.controller';
import { jwtAuthGuard } from '../guards/jwt-auth.guard';

const router = Router();

// Public routes — rate-limited to slow brute-force/credential-stuffing attempts
router.post('/register', authRateLimiter, validateBody(registerSchema), AuthController.register);
router.post('/login', authRateLimiter, validateBody(loginSchema), AuthController.login);
router.post('/refresh-token', authRateLimiter, validateBody(refreshTokenSchema), AuthController.refreshToken);
router.post('/reset-password', authRateLimiter, AuthController.resetPassword);

// Protected routes
router.post('/logout', jwtAuthGuard, AuthController.logout);
router.get('/profile', jwtAuthGuard, AuthController.getProfile);

export default router;
