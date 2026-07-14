"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDefaultSuperAdmin = void 0;
const uuid_1 = require("uuid");
const config_1 = require("../config");
const user_model_1 = require("../models/user.model");
const logger_1 = require("../utils/logger");
const createDefaultSuperAdmin = async () => {
    try {
        const email = config_1.config.super_admin.email;
        const existingUser = await user_model_1.User.findOne({ email });
        if (existingUser) {
            if (existingUser.role === user_model_1.UserRole.SUPER_ADMIN) {
                logger_1.logger.info('Super admin already exists in database');
            }
            else {
                logger_1.logger.warn(`User with email ${email} already exists but has role: ${existingUser.role}. Not creating super admin.`);
            }
            return;
        }
        const superAdmin = await user_model_1.User.create({
            user_id: (0, uuid_1.v4)(),
            user_name: config_1.config.super_admin.name,
            email: email,
            password: config_1.config.super_admin.password,
            phone: config_1.config.super_admin.phone,
            role: user_model_1.UserRole.SUPER_ADMIN,
            is_email_verified: true,
            is_deleted: false,
        });
        console.log(`Email: ${superAdmin.email}, Password: ${config_1.config.super_admin.password}`);
        logger_1.logger.info('Default superadmin created successfully');
        logger_1.logger.info(`Email: ${superAdmin.email}, Password: ${config_1.config.super_admin.password}`);
    }
    catch (error) {
        logger_1.logger.error('Error creating default superadmin:', error);
    }
};
exports.createDefaultSuperAdmin = createDefaultSuperAdmin;
