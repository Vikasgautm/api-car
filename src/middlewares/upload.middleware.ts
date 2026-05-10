import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { AppError } from '../shared/utils/app-error.util';

export interface UploadConfig {
  destination?: string;
  maxFileSize?: number;
  allowedMimeTypes?: string[];
  maxFiles?: number;
}

const defaultConfig: UploadConfig = {
  destination: 'public/uploads/',
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
  maxFiles: 5,
};

export const createUploadMiddleware = (config: UploadConfig = {}) => {
  const mergedConfig = { ...defaultConfig, ...config };

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, mergedConfig.destination || 'public/uploads/');
    },
    filename: (req, file, cb) => {
      const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
      cb(null, uniqueName);
    },
  });

  const fileFilter = (req: any, file: any, cb: any) => {
    if (mergedConfig.allowedMimeTypes && mergedConfig.allowedMimeTypes.length > 0) {
      if (!mergedConfig.allowedMimeTypes.includes(file.mimetype)) {
        return cb(
          AppError.invalidFileType(mergedConfig.allowedMimeTypes),
          false
        );
      }
    }
    cb(null, true);
  };

  return multer({
    storage,
    fileFilter,
    limits: {
      fileSize: mergedConfig.maxFileSize,
      files: mergedConfig.maxFiles,
    },
  });
};

// Default upload middleware with default configuration
export const upload = createUploadMiddleware();

// Convenience methods
export const uploadSingle = (fieldName: string, config?: UploadConfig) => 
  createUploadMiddleware(config).single(fieldName);

export const uploadMultiple = (fieldName: string, maxCount: number = 5, config?: UploadConfig) => 
  createUploadMiddleware({ ...config, maxFiles: maxCount }).array(fieldName, maxCount);

export const uploadFields = (fields: { name: string; maxCount?: number }[], config?: UploadConfig) => 
  createUploadMiddleware(config).fields(fields);
