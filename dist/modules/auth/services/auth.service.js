"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const uuid_1 = require("uuid");
const bcrypt_1 = __importDefault(require("bcrypt"));
const config_1 = require("../../../config");
const app_error_util_1 = require("../../../shared/utils/app-error.util");
const dbConnection_1 = require("../../../sql/utils/dbConnection");
class AuthService {
    static async register(registerDto) {
        const { user_name, email, password, phone, role } = registerDto;
        const pool = await (0, dbConnection_1.getPool)();
        // Check if user already exists
        const [existingUsers] = await pool.pool.execute('SELECT * FROM Users WHERE email = ? AND is_deleted = 0 LIMIT 1', [email]);
        if (existingUsers.length > 0) {
            throw new app_error_util_1.AppError('User with this email already exists', 400);
        }
        // Create new user
        const userId = (0, uuid_1.v4)();
        const hashedPassword = await bcrypt_1.default.hash(password, 12);
        const userRole = role || 'user';
        await pool.pool.execute(`INSERT INTO Users (user_id, user_name, email, password, phone, role, is_email_verified, is_deleted, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, 0, 0, NOW(), NOW())`, [userId, user_name, email, hashedPassword, phone || null, userRole]);
        // Fetch the created user
        const [userRows] = await pool.pool.execute('SELECT * FROM Users WHERE user_id = ? LIMIT 1', [userId]);
        const user = userRows[0];
        this.parseJsonFields(user);
        // // Generate tokens
        // const { accessToken, refreshToken } = await this.generateTokens(user);
        // // Save refresh token session
        // await this.saveRefreshToken(user.user_id, refreshToken);
        return {
            user: this.sanitizeUser(user),
            // accessToken,
            // refreshToken,
        };
    }
    static async login(loginDto, req) {
        const { email, password } = loginDto;
        const pool = await (0, dbConnection_1.getPool)();
        // Find user
        const [userRows] = await pool.pool.execute('SELECT * FROM Users WHERE email = ? AND is_deleted = 0 LIMIT 1', [email]);
        const user = userRows[0];
        if (!user) {
            throw new app_error_util_1.AppError('Invalid credentials', 401);
        }
        // Verify password
        const isPasswordValid = await bcrypt_1.default.compare(password, user.password || '');
        if (!isPasswordValid) {
            throw new app_error_util_1.AppError('Invalid credentials', 401);
        }
        // Update last login
        await pool.pool.execute('UPDATE Users SET last_login_at = NOW(), updatedAt = NOW() WHERE user_id = ?', [user.user_id]);
        user.last_login_at = new Date();
        this.parseJsonFields(user);
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
        const { refreshToken: refresh_token } = refreshTokenDto;
        try {
            // Verify refresh token
            const decoded = jsonwebtoken_1.default.verify(refresh_token, config_1.config.jwt_refresh_secret);
            const pool = await (0, dbConnection_1.getPool)();
            // Check if refresh token exists in database
            const [sessionRows] = await pool.pool.execute('SELECT * FROM UserSessions WHERE user_id = ? AND refresh_token = ? AND is_revoked = 0 LIMIT 1', [decoded.user_id, refresh_token]);
            const session = sessionRows[0];
            if (!session) {
                throw new app_error_util_1.AppError('Invalid or revoked refresh token', 401);
            }
            // Check if session has expired
            if (new Date(session.expires_at) < new Date()) {
                throw new app_error_util_1.AppError('Refresh token has expired. Please login again.', 401);
            }
            // Find user
            const [userRows] = await pool.pool.execute('SELECT * FROM Users WHERE user_id = ? AND is_deleted = 0 LIMIT 1', [decoded.user_id]);
            const user = userRows[0];
            if (!user) {
                throw new app_error_util_1.AppError('User not found', 404);
            }
            this.parseJsonFields(user);
            // Generate new tokens
            const { accessToken, refreshToken } = await this.generateTokens(user);
            // Revoke old refresh token
            await pool.pool.execute('UPDATE UserSessions SET is_revoked = 1, revoked_at = NOW(), updatedAt = NOW() WHERE session_id = ?', [session.session_id]);
            // Save new refresh token
            await this.saveRefreshToken(user.user_id, refreshToken);
            return {
                user: this.sanitizeUser(user),
                accessToken,
                refreshToken,
            };
        }
        catch (error) {
            if (error.name === 'TokenExpiredError') {
                throw new app_error_util_1.AppError('Refresh token has expired. Please login again.', 401);
            }
            else if (error.name === 'JsonWebTokenError') {
                throw new app_error_util_1.AppError('Invalid refresh token', 401);
            }
            else if (error instanceof app_error_util_1.AppError) {
                throw error;
            }
            else {
                throw new app_error_util_1.AppError('Failed to refresh token', 401);
            }
        }
    }
    static async logout(user_id) {
        const pool = await (0, dbConnection_1.getPool)();
        // Revoke all refresh tokens for this user
        await pool.pool.execute('UPDATE UserSessions SET is_revoked = 1, revoked_at = NOW(), updatedAt = NOW() WHERE user_id = ? AND is_revoked = 0', [user_id]);
        return { message: 'Logged out successfully' };
    }
    static async getProfile(user_id) {
        const pool = await (0, dbConnection_1.getPool)();
        const [userRows] = await pool.pool.execute('SELECT * FROM Users WHERE user_id = ? AND is_deleted = 0 LIMIT 1', [user_id]);
        const user = userRows[0];
        if (!user) {
            throw new app_error_util_1.AppError('User not found', 404);
        }
        this.parseJsonFields(user);
        return this.sanitizeUser(user);
    }
    static async resetPassword(token, user_id, password) {
        const pool = await (0, dbConnection_1.getPool)();
        // Find user
        const [userRows] = await pool.pool.execute('SELECT * FROM Users WHERE user_id = ? AND is_deleted = 0 LIMIT 1', [user_id]);
        const user = userRows[0];
        if (!user) {
            throw new app_error_util_1.AppError('User not found', 404);
        }
        // Verify token
        const tokenHash = crypto_1.default.createHash('sha256').update(token).digest('hex');
        if (user.password_reset_token !== tokenHash) {
            throw new app_error_util_1.AppError('Invalid reset token', 400);
        }
        // Check if token has expired
        if (!user.password_reset_expires || new Date(user.password_reset_expires) < new Date()) {
            throw new app_error_util_1.AppError('Reset token has expired', 400);
        }
        // Update password and clear reset token
        const hashedPassword = await bcrypt_1.default.hash(password, 12);
        await pool.pool.execute('UPDATE Users SET password = ?, password_reset_token = NULL, password_reset_expires = NULL, updatedAt = NOW() WHERE user_id = ?', [hashedPassword, user_id]);
        return { message: 'Password reset successfully' };
    }
    static async generateTokens(user) {
        const accessToken = jsonwebtoken_1.default.sign({
            id: user.id,
            user_id: user.user_id,
            email: user.email,
            role: user.role,
            phone: user.phone,
            permissions: user.permissions,
            is_email_verified: user.is_email_verified,
            last_login_at: user.last_login_at,
            theme: user.theme
        }, config_1.config.jwt_secret, { expiresIn: config_1.config.jwt_expires_in });
        const refreshToken = jsonwebtoken_1.default.sign({
            id: user.id,
            user_id: user.user_id,
            email: user.email,
            role: user.role
        }, config_1.config.jwt_refresh_secret, { expiresIn: config_1.config.jwt_refresh_expires_in });
        return { accessToken, refreshToken };
    }
    static async saveRefreshToken(user_id, refreshToken, deviceInfo, ipAddress) {
        const expiresMs = this.parseExpiresIn(config_1.config.jwt_refresh_expires_in);
        const expiresAt = new Date(Date.now() + expiresMs);
        const sessionId = (0, uuid_1.v4)();
        const pool = await (0, dbConnection_1.getPool)();
        await pool.pool.execute(`INSERT INTO UserSessions (session_id, user_id, refresh_token, expires_at, is_revoked, device_info, ip_address, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, 0, ?, ?, NOW(), NOW())`, [sessionId, user_id, refreshToken, expiresAt, deviceInfo || null, ipAddress || null]);
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
    static parseJsonFields(user) {
        if (!user)
            return;
        const jsonFields = ['permissions', 'assigned_brands', 'assigned_domains', 'workflow_rights', 'security'];
        for (const f of jsonFields) {
            if (typeof user[f] === 'string') {
                try {
                    user[f] = JSON.parse(user[f]);
                }
                catch (e) {
                    // Keep as string
                }
            }
        }
    }
    static sanitizeUser(user) {
        const userObj = { ...user };
        delete userObj.password;
        delete userObj.password_reset_token;
        delete userObj.password_reset_expires;
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
