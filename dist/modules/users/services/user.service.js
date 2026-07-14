"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const user_model_1 = require("../../../models/user.model");
const app_error_util_1 = require("../../../shared/utils/app-error.util");
const pagination_util_1 = require("../../../shared/utils/pagination.util");
const email_service_1 = require("../../../shared/services/email.service");
const config_1 = require("../../../config");
const dbConnection_1 = require("../../../sql/utils/dbConnection");
class UserService {
    static async getAllUsers(filterDto, includeDeleted = false) {
        const { page = 1, limit = 10, role, is_email_verified, is_active, is_deleted, q, sortBy = 'createdAt', sortOrder = 'desc', } = filterDto;
        const filter = {};
        if (!includeDeleted) {
            filter.is_deleted = false;
        }
        // Allow explicit is_deleted filter when includeDeleted is true
        if (includeDeleted && is_deleted !== undefined) {
            filter.is_deleted = is_deleted === 'true' || is_deleted === true;
        }
        if (role !== undefined) {
            filter.role = role;
        }
        if (is_email_verified !== undefined) {
            filter.is_email_verified = is_email_verified === 'true' || is_email_verified === true;
        }
        if (is_active !== undefined) {
            filter.is_active = is_active === 'true' || is_active === true;
        }
        if (q) {
            filter.$or = [
                { user_name: { $regex: q, $options: 'i' } },
                { email: { $regex: q, $options: 'i' } },
            ];
        }
        const { skip, limit: validatedLimit } = pagination_util_1.PaginationUtil.getPaginationParams(page, limit);
        const sortFilter = {};
        sortFilter[sortBy] = sortOrder === 'desc' ? -1 : 1;
        const users = await user_model_1.User.find(filter)
            .select("-password")
            .sort(sortFilter)
            .skip(skip)
            .limit(validatedLimit);
        const total = await user_model_1.User.countDocuments(filter);
        const paginationMeta = pagination_util_1.PaginationUtil.createPaginationMeta(page, validatedLimit, total);
        return { users, pagination: paginationMeta };
    }
    static async getUserById(userId) {
        return await user_model_1.User.findOne({ user_id: userId }).select("-password");
    }
    static async createUser(userData) {
        const { user_name, email, role, password, is_active } = userData;
        // Validate required fields
        if (!user_name || !email || !role) {
            throw new app_error_util_1.AppError('Name, email, and role are required', 400);
        }
        const pool = await (0, dbConnection_1.getPool)();
        // Check if email already exists
        const [existingUsers] = await pool.pool.execute('SELECT * FROM Users WHERE email = ? AND is_deleted = 0 LIMIT 1', [email]);
        if (existingUsers.length > 0) {
            throw new app_error_util_1.AppError('User with this email already exists', 409);
        }
        // Generate user_id from email (remove domain and special chars)
        const user_id = email.split('@')[0].replace(/[^a-z0-9]/gi, '_').toLowerCase();
        // Create user
        let hashedPassword = null;
        let resetTokenHash = null;
        let resetExpires = null;
        let resetToken = undefined;
        if (password) {
            hashedPassword = await bcrypt_1.default.hash(password, 12);
        }
        else {
            // Generate password reset token for invite link
            resetToken = crypto_1.default.randomBytes(32).toString('hex');
            resetTokenHash = crypto_1.default.createHash('sha256').update(resetToken).digest('hex');
            resetExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
        }
        const isActiveVal = is_active !== undefined ? (is_active ? 1 : 0) : 1;
        await pool.pool.execute(`INSERT INTO Users (user_id, user_name, email, role, password, password_reset_token, password_reset_expires, is_active, is_deleted, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, NOW(), NOW())`, [user_id, user_name, email, role, hashedPassword, resetTokenHash, resetExpires, isActiveVal]);
        // Retrieve user details
        const [userRows] = await pool.pool.execute('SELECT * FROM Users WHERE user_id = ? LIMIT 1', [user_id]);
        const userObj = userRows[0];
        this.parseJsonFields(userObj);
        // Send invite email if no password was provided
        if (resetToken) {
            const resetUrl = `${config_1.config.app.frontend_url}/auth/set-password?token=${resetToken}&user_id=${userObj.user_id}`;
            try {
                await email_service_1.EmailService.sendInviteEmail(email, user_name, resetUrl);
            }
            catch (error) {
                console.error('Failed to send invite email:', error);
                // Don't fail user creation if email sending fails
            }
        }
        delete userObj.password;
        return userObj;
    }
    static async deleteUser(userId) {
        const pool = await (0, dbConnection_1.getPool)();
        // Check if user exists
        const [userRows] = await pool.pool.execute('SELECT * FROM Users WHERE user_id = ? AND is_deleted = 0 LIMIT 1', [userId]);
        if (userRows.length === 0) {
            throw new app_error_util_1.AppError('User not found', 404);
        }
        await pool.pool.execute('UPDATE Users SET is_deleted = 1, updatedAt = NOW() WHERE user_id = ?', [userId]);
        const [updatedRows] = await pool.pool.execute('SELECT * FROM Users WHERE user_id = ? LIMIT 1', [userId]);
        const userObj = updatedRows[0];
        this.parseJsonFields(userObj);
        delete userObj.password;
        return userObj;
    }
    static async restoreUser(userId) {
        const pool = await (0, dbConnection_1.getPool)();
        // Check if user exists and is deleted
        const [userRows] = await pool.pool.execute('SELECT * FROM Users WHERE user_id = ? AND is_deleted = 1 LIMIT 1', [userId]);
        if (userRows.length === 0) {
            throw new app_error_util_1.AppError('User not found or not deleted', 404);
        }
        await pool.pool.execute('UPDATE Users SET is_deleted = 0, updatedAt = NOW() WHERE user_id = ?', [userId]);
        const [updatedRows] = await pool.pool.execute('SELECT * FROM Users WHERE user_id = ? LIMIT 1', [userId]);
        const userObj = updatedRows[0];
        this.parseJsonFields(userObj);
        delete userObj.password;
        return userObj;
    }
    static async updateUser(userId, updateData) {
        const pool = await (0, dbConnection_1.getPool)();
        // Check if user exists
        const [userRows] = await pool.pool.execute('SELECT * FROM Users WHERE user_id = ? AND is_deleted = 0 LIMIT 1', [userId]);
        if (userRows.length === 0) {
            throw new app_error_util_1.AppError('User not found', 404);
        }
        // Check if email is being updated and if it already exists
        if (updateData.email) {
            const [existingUsers] = await pool.pool.execute('SELECT * FROM Users WHERE email = ? AND user_id <> ? AND is_deleted = 0 LIMIT 1', [updateData.email, userId]);
            if (existingUsers.length > 0) {
                throw new app_error_util_1.AppError('Email already in use', 409);
            }
        }
        // Build dynamic UPDATE query
        const setClauses = [];
        const values = [];
        const keysToUpdate = Object.keys(updateData).filter(k => k !== 'id' && k !== 'user_id' && typeof updateData[k] !== 'function');
        for (const key of keysToUpdate) {
            setClauses.push(`\`${key}\` = ?`);
            let val = updateData[key];
            if (val !== null && typeof val === 'object' && !(val instanceof Date)) {
                val = JSON.stringify(val);
            }
            values.push(val);
        }
        if (setClauses.length > 0) {
            values.push(userId);
            await pool.pool.execute(`UPDATE Users SET ${setClauses.join(', ')}, updatedAt = NOW() WHERE user_id = ?`, values);
        }
        const [updatedRows] = await pool.pool.execute('SELECT * FROM Users WHERE user_id = ? LIMIT 1', [userId]);
        const userObj = updatedRows[0];
        this.parseJsonFields(userObj);
        delete userObj.password;
        return userObj;
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
}
exports.UserService = UserService;
