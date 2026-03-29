import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const config = {
  port: process.env.PORT || 4500,
  mongodb_uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/car-salahakar',
  jwt_secret: process.env.JWT_SECRET || 'your-secret-key',
  jwt_expires_in: process.env.JWT_EXPIRES_IN || '7d',
  env: process.env.NODE_ENV || 'development',
  cors_origin: process.env.CORS_ORIGIN || '*',
};
