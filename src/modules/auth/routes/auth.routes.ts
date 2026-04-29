import { Router } from 'express';
import { validateBody } from '../../../middlewares/validate.middleware';
import { loginSchema, refreshTokenSchema, registerSchema } from '../../../shared/validation';
import { AuthController } from '../controllers/auth.controller';
import { jwtAuthGuard } from '../guards/jwt-auth.guard';

const router = Router();

// Public routes
router.post('/register', validateBody(registerSchema), AuthController.register);
router.post('/login', validateBody(loginSchema), AuthController.login);
router.post('/refresh-token', validateBody(refreshTokenSchema), AuthController.refreshToken);

// Protected routes
router.post('/logout', jwtAuthGuard, AuthController.logout);
router.get('/profile', jwtAuthGuard, AuthController.getProfile);

export default router;
