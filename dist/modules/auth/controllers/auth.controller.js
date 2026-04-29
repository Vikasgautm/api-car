"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const app_error_util_1 = require("../../../shared/utils/app-error.util");
const response_util_1 = require("../../../shared/utils/response.util");
const login_dto_1 = require("../dto/login.dto");
const refresh_token_dto_1 = require("../dto/refresh-token.dto");
const register_dto_1 = require("../dto/register.dto");
const auth_service_1 = require("../services/auth.service");
class AuthController {
    static async register(req, res, next) {
        try {
            const registerDto = req.body;
            // Validate DTO
            const validation = register_dto_1.RegisterDto.validate(registerDto);
            if (!validation.valid) {
                throw new app_error_util_1.AppError(validation.errors.join(', '), 400);
            }
            const result = await auth_service_1.AuthService.register(registerDto);
            return response_util_1.ResponseUtil.created(res, result, 'User registered successfully');
        }
        catch (error) {
            next(error);
        }
    }
    static async login(req, res, next) {
        try {
            const loginDto = req.body;
            // Validate DTO
            const validation = login_dto_1.LoginDto.validate(loginDto);
            if (!validation.valid) {
                throw new app_error_util_1.AppError(validation.errors.join(', '), 400);
            }
            const result = await auth_service_1.AuthService.login(loginDto, req);
            return response_util_1.ResponseUtil.success(res, result, 'Login successful');
        }
        catch (error) {
            next(error);
        }
    }
    static async refreshToken(req, res, next) {
        try {
            const refreshTokenDto = req.body;
            // Validate DTO
            const validation = refresh_token_dto_1.RefreshTokenDto.validate(refreshTokenDto);
            if (!validation.valid) {
                throw new app_error_util_1.AppError(validation.errors.join(', '), 400);
            }
            const result = await auth_service_1.AuthService.refreshToken(refreshTokenDto);
            return response_util_1.ResponseUtil.success(res, result, 'Token refreshed successfully');
        }
        catch (error) {
            next(error);
        }
    }
    static async logout(req, res, next) {
        try {
            const user = req.user;
            const user_id = user?.user_id || user?.id;
            if (!user_id) {
                throw new app_error_util_1.AppError('User not authenticated', 401);
            }
            const result = await auth_service_1.AuthService.logout(user_id);
            return response_util_1.ResponseUtil.success(res, result, 'Logout successful');
        }
        catch (error) {
            next(error);
        }
    }
    static async getProfile(req, res, next) {
        try {
            const user = req.user;
            const user_id = user?.user_id || user?.id;
            if (!user_id) {
                throw new app_error_util_1.AppError('User not authenticated', 401);
            }
            const userProfile = await auth_service_1.AuthService.getProfile(user_id);
            return response_util_1.ResponseUtil.success(res, userProfile, 'Profile retrieved successfully');
        }
        catch (error) {
            next(error);
        }
    }
}
exports.AuthController = AuthController;
//# sourceMappingURL=auth.controller.js.map