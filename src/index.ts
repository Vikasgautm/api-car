import mongoose from 'mongoose';
import app from './app';
import { config } from './config';
import { logger } from './utils/logger';
import { createDefaultSuperAdmin } from './seeds/admin.seed';

const startServer = async () => {
  try {
    // MongoDB Connection
    await mongoose.connect(config.mongodb_uri);
    logger.info('Successfully connected to MongoDB');

    // Create default superadmin
    // await createDefaultSuperAdmin();

    // Start Express Server
    app.listen(config.port, () => {
      logger.info(`Server is running on http://localhost:${config.port}`);
    });
  } catch (error) {
    logger.error('Error starting server:', error);
    process.exit(1);
  }
};

startServer();
