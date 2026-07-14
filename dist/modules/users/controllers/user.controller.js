"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const validation_1 = require("../../../shared/validation");
const user_model_1 = require("../../../models/user.model");
const app_error_util_1 = require("../../../shared/utils/app-error.util");
const response_util_1 = require("../../../shared/utils/response.util");
const catchAsync_1 = require("../../../utils/catchAsync");
const user_service_1 = require("../services/user.service");
class UserController {
    static getProfile = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const user = req.user;
        const userId = user?.user_id || user?.id;
        if (!userId) {
            throw new app_error_util_1.AppError("User not authenticated", 401);
        }
        const userProfile = await user_model_1.User.findOne({ user_id: userId, is_deleted: false }).select("-password");
        if (!userProfile) {
            throw new app_error_util_1.AppError("User not found", 404);
        }
        return response_util_1.ResponseUtil.success(res, userProfile, "Profile retrieved successfully");
    });
    static updateProfile = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const user = req.user;
        const userId = user?.user_id || user?.id;
        if (!userId) {
            throw new app_error_util_1.AppError("User not authenticated", 401);
        }
        const { user_name, phone } = req.body;
        let updateData = {};
        if (user_name)
            updateData.user_name = user_name;
        if (phone)
            updateData.phone = phone;
        if (req.file) {
            const cloudinaryFile = req.file;
            updateData.profile_pic = cloudinaryFile.secure_url || req.file.path;
        }
        const updateDto = { user_name, phone, profile_pic: updateData.profile_pic };
        const validation = validation_1.updateProfileSchema.safeParse(updateDto);
        if (!validation.success) {
            throw new app_error_util_1.AppError(validation.error.issues.map(e => e.message).join(', '), 400);
        }
        const updatedUser = await user_model_1.User.findOneAndUpdate({ user_id: userId, is_deleted: false }, updateData, {
            returnDocument: 'after',
        }).select("-password");
        if (!updatedUser) {
            throw new app_error_util_1.AppError("User not found", 404);
        }
        return response_util_1.ResponseUtil.success(res, updatedUser, "Profile updated successfully");
    });
    // Admin endpoints
    static getAllAdminUsers = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const filterDto = req.query;
        const validation = validation_1.userFilterSchema.safeParse(filterDto);
        if (!validation.success) {
            throw new app_error_util_1.AppError(validation.error.issues.map(e => e.message).join(', '), 400);
        }
        const includeDeleted = req.query.include_deleted === 'true';
        const result = await user_service_1.UserService.getAllUsers(filterDto, includeDeleted);
        return response_util_1.ResponseUtil.paginated(res, result.users, result.pagination, 'Users retrieved successfully');
    });
    static createAdminUser = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const userData = req.body;
        // Check if user with this email already exists
        const existingUser = await user_model_1.User.findOne({ email: userData.email, is_deleted: false });
        if (existingUser) {
            throw new app_error_util_1.AppError("User with this email already exists", 400);
        }
        const user = await user_service_1.UserService.createUser(userData);
        return response_util_1.ResponseUtil.success(res, user, "User created successfully");
    });
    static getAdminUserById = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const user = await user_service_1.UserService.getUserById(req.params.id);
        if (!user) {
            throw new app_error_util_1.AppError("User not found", 404);
        }
        return response_util_1.ResponseUtil.success(res, user, "User retrieved successfully");
    });
    static deleteUser = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const user = await user_service_1.UserService.deleteUser(req.params.id);
        return response_util_1.ResponseUtil.success(res, user, "User deleted successfully");
    });
    static restoreUser = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const user = await user_service_1.UserService.restoreUser(req.params.id);
        return response_util_1.ResponseUtil.success(res, user, "User restored successfully");
    });
    static updateUser = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const userId = req.params.id;
        const updateDto = req.body;
        const validation = validation_1.adminUpdateUserSchema.safeParse(updateDto);
        if (!validation.success) {
            throw new app_error_util_1.AppError(validation.error.issues.map(e => e.message).join(', '), 400);
        }
        const user = await user_service_1.UserService.updateUser(userId, updateDto);
        return response_util_1.ResponseUtil.success(res, user, "User updated successfully");
    });
}
exports.UserController = UserController;
