"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userFilterSchema = exports.adminUpdateUserSchema = exports.updateProfileSchema = exports.refreshTokenSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
const common_validation_schemas_1 = require("./common-validation.schemas");
// User DTO schemas
exports.registerSchema = zod_1.z.object({
    user_name: zod_1.z.string().min(2, 'Name must be at least 2 characters'),
    email: common_validation_schemas_1.emailSchema,
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
    phone: zod_1.z.string().min(10, 'Phone number must be at least 10 characters').optional(),
    role: common_validation_schemas_1.userRoleSchema.optional(),
}).strict();
exports.loginSchema = zod_1.z.object({
    email: common_validation_schemas_1.emailSchema,
    password: zod_1.z.string().min(1, 'Password is required'),
}).strict();
exports.refreshTokenSchema = zod_1.z.object({
    refreshToken: zod_1.z.string().min(1, 'Refresh token is required'),
}).strict();
exports.updateProfileSchema = zod_1.z.object({
    user_name: zod_1.z.string().min(2, 'Name must be at least 2 characters').optional(),
    phone: zod_1.z.string().min(10, 'Phone number must be at least 10 characters').optional().or(zod_1.z.literal('')),
    profile_pic: zod_1.z.string().url().optional().or(zod_1.z.literal('')),
}).strict();
exports.adminUpdateUserSchema = zod_1.z.object({
    user_name: zod_1.z.string().min(2, 'Name must be at least 2 characters').optional(),
    email: common_validation_schemas_1.emailSchema.optional(),
    phone: zod_1.z.string().min(10, 'Phone number must be at least 10 characters').optional().or(zod_1.z.literal('')),
    profile_pic: zod_1.z.string().url().optional().or(zod_1.z.literal('')),
    role: common_validation_schemas_1.userRoleSchema.optional(),
    is_email_verified: zod_1.z.boolean().optional(),
    theme: zod_1.z.string().optional(),
}).strict();
exports.userFilterSchema = common_validation_schemas_1.paginationSchema.extend({
    role: common_validation_schemas_1.userRoleSchema.optional(),
    is_email_verified: zod_1.z.union([zod_1.z.boolean(), zod_1.z.enum(['true', 'false'])]).optional(),
    is_deleted: zod_1.z.union([zod_1.z.boolean(), zod_1.z.enum(['true', 'false'])]).optional(),
}).strict();
