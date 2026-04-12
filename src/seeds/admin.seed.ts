import { v4 as uuidv4 } from 'uuid';
import { User } from '../models/user.model';
import { logger } from '../utils/logger';

export const createDefaultSuperAdmin = async () => {
  try {
    const existingAdmin = await User.findOne({ role: 'superadmin', email: 'admin@example.com' });

    if (existingAdmin) {
      logger.info('Default superadmin already exists');
      return;
    }

    const superAdmin = await User.create({
      user_id: uuidv4(),
      user_name: 'Super Admin',
      email: 'admin@carsalhakar.com',
      password: 'admin@123',
      phone: '+1234567890',
      role: 'superadmin',
      is_email_verified: true,
      is_deleted: false,
    });
    console.log(`Email: ${superAdmin.email}, Password: admin@123`)
    logger.info('Default superadmin created successfully');
    logger.info(`Email: ${superAdmin.email}, Password: admin@123`);
  } catch (error) {
    logger.error('Error creating default superadmin:', error);
  }
};
