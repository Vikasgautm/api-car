"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const user_model_1 = require("../../../models/user.model");
const app_error_util_1 = require("../../../shared/utils/app-error.util");
const pagination_util_1 = require("../../../shared/utils/pagination.util");
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
//# sourceMappingURL=user.service.js.map