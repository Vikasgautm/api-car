"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDefaultSuperAdmin = void 0;
const uuid_1 = require("uuid");
const user_model_1 = require("../models/user.model");
const logger_1 = require("../utils/logger");
const createDefaultSuperAdmin = async () => {
    try {
        const existingAdmin = await user_model_1.User.findOne({ role: 'superadmin', email: 'admin@example.com' });
        if (existingAdmin) {
            logger_1.logger.info('Default superadmin already exists');
            return;
        }
        const superAdmin = await user_model_1.User.create({
            user_id: (0, uuid_1.v4)(),
            user_name: 'Super Admin',
            email: 'admin@carsalhakar.com',
            password: 'admin@123',
            phone: '+1234567890',
            role: 'superadmin',
            is_email_verified: true,
            is_deleted: false,
        });
        console.log(`Email: ${superAdmin.email}, Password: admin@123`);
        logger_1.logger.info('Default superadmin created successfully');
        logger_1.logger.info(`Email: ${superAdmin.email}, Password: admin@123`);
    }
    catch (error) {
        logger_1.logger.error('Error creating default superadmin:', error);
    }
};
exports.createDefaultSuperAdmin = createDefaultSuperAdmin;
//# sourceMappingURL=admin.seed.js.map