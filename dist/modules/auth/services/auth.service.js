"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const uuid_1 = require("uuid");
const config_1 = require("../../../config");
const user_session_model_1 = require("../../../models/user-session.model");
const user_model_1 = require("../../../models/user.model");
const app_error_util_1 = require("../../../shared/utils/app-error.util");
class AuthService {
    static async register(registerDto) {
        const { user_name, email, password, phone, role } = registerDto;
        // Check if user already exists
        const existingUser = await user_model_1.User.findOne({ email, is_deleted: false });
        if (existingUser) {
            throw new app_error_util_1.AppError('User with this email already exists', 400);
        }
        // Create new user
        const user = new user_model_1.User({
            user_id: (0, uuid_1.v4)(),
            user_name,
            email,
            password,
            phone,
            role: role || 'user',
            is_email_verified: false,
            is_deleted: false,
        });
        await user.save();
        // Generate tokens
        const { accessToken, refreshToken } = await this.generateTokens(user);
        // Save refresh token session
        await this.saveRefreshToken(user.user_id, refreshToken);
        return {
            user: this.sanitizeUser(user),
            accessToken,
            refreshToken,
        };
    }
    static async login(loginDto, req) {
        const { email, password } = loginDto;
        // Find user
        const user = await user_model_1.User.findOne({ email, is_deleted: false }).select('+password');
        if (!user) {
            throw new app_error_util_1.AppError('Invalid credentials', 401);
        }
        // Verify password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            throw new app_error_util_1.AppError('Invalid credentials', 401);
        }
        // Update last login
        user.last_login_at = new Date();
        await user.save();
        // Generate tokens
        const { accessToken, refreshToken } = await this.generateTokens(user);
        // Save refresh token session with device info
        const deviceInfo = this.extractDeviceInfo(req);
        const ipAddress = this.extractIpAddress(req);
        await this.saveRefreshToken(user.user_id, refreshToken, deviceInfo, ipAddress);
        return {
            user: this.sanitizeUser(user),
            accessToken,
            refreshToken,
        };
    }
    static async refreshToken(refreshTokenDto) {
        const { refresh_token } = refreshTokenDto;
        // Verify refresh token
        const decoded = jsonwebtoken_1.default.verify(refresh_token, config_1.config.jwt_refresh_secret);
        // Check if refresh token exists in database
        const session = await user_session_model_1.UserSession.findOne({
            user_id: decoded.user_id,
            refresh_token: refresh_token,
            is_revoked: false,
        });
        if (!session) {
            throw new app_error_util_1.AppError('Invalid refresh token', 401);
        }
        // Find user
        const user = await user_model_1.User.findOne({ user_id: decoded.user_id, is_deleted: false });
        if (!user) {
            throw new app_error_util_1.AppError('User not found', 404);
        }
        // Generate new tokens
        const { accessToken, refreshToken } = await this.generateTokens(user);
        // Revoke old refresh token
        session.is_revoked = true;
        await session.save();
        // Save new refresh token
        await this.saveRefreshToken(user.user_id, refreshToken);
        return {
            user: this.sanitizeUser(user),
            accessToken,
            refreshToken,
        };
    }
    static async logout(user_id) {
        // Revoke all refresh tokens for this user
        await user_session_model_1.UserSession.updateMany({ user_id, is_revoked: false }, { is_revoked: true });
        return { message: 'Logged out successfully' };
    }
    static async getProfile(user_id) {
        const user = await user_model_1.User.findOne({ user_id, is_deleted: false });
        if (!user) {
            throw new app_error_util_1.AppError('User not found', 404);
        }
        return this.sanitizeUser(user);
    }
    static async generateTokens(user) {
        const accessToken = jsonwebtoken_1.default.sign({
            id: user.user_id,
            email: user.email,
            role: user.role,
        }, config_1.config.jwt_secret, { expiresIn: '15m' });
        const refreshToken = jsonwebtoken_1.default.sign({ user_id: user.user_id }, config_1.config.jwt_refresh_secret, { expiresIn: '7d' });
        return { accessToken, refreshToken };
    }
    static async saveRefreshToken(user_id, refreshToken, deviceInfo, ipAddress) {
        const expiresMs = this.parseExpiresIn(config_1.config.jwt_refresh_expires_in);
        const session = new user_session_model_1.UserSession({
            session_id: (0, uuid_1.v4)(),
            user_id,
            refresh_token: refreshToken,
            is_revoked: false,
            expires_at: new Date(Date.now() + expiresMs),
            device_info: deviceInfo,
            ip_address: ipAddress,
        });
        await session.save();
    }
    static parseExpiresIn(expiresIn) {
        const match = expiresIn.match(/^(\d+)([smhd])$/);
        if (!match)
            return 7 * 24 * 60 * 60 * 1000; // Default 7 days
        const value = parseInt(match[1], 10);
        const unit = match[2];
        const multipliers = {
            s: 1000,
            m: 60 * 1000,
            h: 60 * 60 * 1000,
            d: 24 * 60 * 60 * 1000,
        };
        return value * (multipliers[unit] || multipliers['d']);
    }
    static sanitizeUser(user) {
        const userObj = user.toObject();
        delete userObj.password;
        delete userObj.__v;
        return userObj;
    }
    static extractDeviceInfo(req) {
        if (!req)
            return undefined;
        const userAgent = req.headers['user-agent'];
        return userAgent ? String(userAgent) : undefined;
    }
    static extractIpAddress(req) {
        if (!req)
            return undefined;
        const forwarded = req.headers['x-forwarded-for'];
        if (forwarded) {
            return forwarded.split(',')[0].trim();
        }
        return req.ip || req.connection?.remoteAddress;
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=auth.service.js.map