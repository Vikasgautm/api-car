import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';
import { User, UserRole } from '../models/user.model';
import { logger } from '../utils/logger';

export const createDefaultSuperAdmin = async () => {
  try {
    const email = config.super_admin.email;
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      if (existingUser.role === UserRole.SUPER_ADMIN) {
        logger.info('Super admin already exists in database');
      } else {
        logger.warn(`User with email ${email} already exists but has role: ${existingUser.role}. Not creating super admin.`);
      }
      return;
    }

    const superAdmin = await User.create({
      user_id: uuidv4(),
      user_name: config.super_admin.name,
      email: email,
      password: config.super_admin.password,
      phone: config.super_admin.phone,
      role: UserRole.SUPER_ADMIN,
      is_email_verified: true,
      is_deleted: false,
    });
    console.log(`Email: ${superAdmin.email}, Password: ${config.super_admin.password}`)
    logger.info('Default superadmin created successfully');
    logger.info(`Email: ${superAdmin.email}, Password: ${config.super_admin.password}`);
  } catch (error) {
    logger.error('Error creating default superadmin:', error);
  }
};
