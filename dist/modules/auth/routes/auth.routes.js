"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const rate_limit_middleware_1 = require("../../../middlewares/rate-limit.middleware");
const validate_middleware_1 = require("../../../middlewares/validate.middleware");
const validation_1 = require("../../../shared/validation");
const auth_controller_1 = require("../controllers/auth.controller");
const jwt_auth_guard_1 = require("../guards/jwt-auth.guard");
const router = (0, express_1.Router)();
// Public routes — rate-limited to slow brute-force/credential-stuffing attempts
router.post('/register', rate_limit_middleware_1.authRateLimiter, (0, validate_middleware_1.validateBody)(validation_1.registerSchema), auth_controller_1.AuthController.register);
router.post('/login', rate_limit_middleware_1.authRateLimiter, (0, validate_middleware_1.validateBody)(validation_1.loginSchema), auth_controller_1.AuthController.login);
router.post('/refresh-token', rate_limit_middleware_1.authRateLimiter, (0, validate_middleware_1.validateBody)(validation_1.refreshTokenSchema), auth_controller_1.AuthController.refreshToken);
router.post('/reset-password', rate_limit_middleware_1.authRateLimiter, auth_controller_1.AuthController.resetPassword);
// Protected routes
router.post('/logout', jwt_auth_guard_1.jwtAuthGuard, auth_controller_1.AuthController.logout);
router.get('/profile', jwt_auth_guard_1.jwtAuthGuard, auth_controller_1.AuthController.getProfile);
exports.default = router;
