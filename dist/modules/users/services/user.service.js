"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const user_model_1 = require("../../../models/user.model");
const app_error_util_1 = require("../../../shared/utils/app-error.util");
const pagination_util_1 = require("../../../shared/utils/pagination.util");
const email_service_1 = require("../../../shared/services/email.service");
const config_1 = require("../../../config");
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
        // Check if email already exists
        const existingUser = await user_model_1.User.findOne({ email: email, is_deleted: false });
        if (existingUser) {
            throw new app_error_util_1.AppError('User with this email already exists', 409);
        }
        // Generate user_id from email (remove domain and special chars)
        const user_id = email.split('@')[0].replace(/[^a-z0-9]/gi, '_').toLowerCase();
        // Create user
        const createData = {
            user_id,
            user_name,
            email,
            role,
            is_active: is_active !== undefined ? is_active : true,
            is_deleted: false,
        };
        // If password provided, use it; otherwise generate reset token for invite
        let resetToken;
        if (password) {
            createData.password = password;
        }
        else {
            // Generate password reset token for invite link
            resetToken = crypto_1.default.randomBytes(32).toString('hex');
            const resetHash = crypto_1.default.createHash('sha256').update(resetToken).digest('hex');
            createData.password_reset_token = resetHash;
            createData.password_reset_expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
        }
        const user = await user_model_1.User.create(createData);
        // Send invite email if no password was provided
        if (resetToken) {
            const resetUrl = `${config_1.config.app.frontend_url}/auth/set-password?token=${resetToken}&user_id=${user.user_id}`;
            try {
                await email_service_1.EmailService.sendInviteEmail(email, user_name, resetUrl);
            }
            catch (error) {
                console.error('Failed to send invite email:', error);
                // Don't fail user creation if email sending fails
            }
        }
        return user;
    }
    static async deleteUser(userId) {
        const user = await user_model_1.User.findOneAndUpdate({ user_id: userId }, { is_deleted: true }, { returnDocument: 'after' }).select("-password");
        if (!user) {
            throw new app_error_util_1.AppError('User not found', 404);
        }
        return user;
    }
    static async restoreUser(userId) {
        const user = await user_model_1.User.findOneAndUpdate({ user_id: userId, is_deleted: true }, { is_deleted: false }, { returnDocument: 'after' }).select("-password");
        if (!user) {
            throw new app_error_util_1.AppError('User not found or not deleted', 404);
        }
        return user;
    }
    static async updateUser(userId, updateData) {
        // Check if email is being updated and if it already exists
        if (updateData.email) {
            const existingUser = await user_model_1.User.findOne({
                email: updateData.email,
                user_id: { $ne: userId },
                is_deleted: false,
            });
            if (existingUser) {
                throw new app_error_util_1.AppError('Email already in use', 409);
            }
        }
        const user = await user_model_1.User.findOneAndUpdate({ user_id: userId, is_deleted: false }, updateData, { returnDocument: 'after', runValidators: true }).select("-password");
        if (!user) {
            throw new app_error_util_1.AppError('User not found', 404);
        }
        return user;
    }
}
exports.UserService = UserService;
