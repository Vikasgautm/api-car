import { v2 as cloudinary } from 'cloudinary';
import { Request } from 'express';
import fs from 'fs';
import multer, { FileFilterCallback, StorageEngine } from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import path from 'path';
import { config } from '../../config';
import { AppError } from '../utils/app-error.util';

cloudinary.config({
  cloud_name: config.cloudinary_cloud_name,
  api_key: config.cloudinary_api_key,
  api_secret: config.cloudinary_api_secret,
});

export interface UploadConfig {
  fieldName: string;
  maxFileSize?: number;
  allowedMimeTypes?: string[];
  maxFiles?: number;
  useCloudinary?: boolean;
  folder?: string;
  fields?: Array<{ name: string; maxCount: number }>;
}

export interface UploadedFile {
  url: string;
  publicId?: string;
  originalName: string;
  mimeType: string;
  size: number;
}

export class UploadService {
  private static readonly DEFAULT_MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  private static readonly DEFAULT_ALLOWED_MIME_TYPES = [
    'image/*',
  ];

  private static readonly MIME_TYPE_MAP: Record<string, string> = {
    'image/jpeg': 'jpeg',
    'image/jpg': 'jpeg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/avif': 'avif',
    'image/svg+xml': 'svg',
    'image/tiff': 'tiff',
    'application/pdf': 'pdf',
  };

  static getMimeType(mimeType: string): string {
    return this.MIME_TYPE_MAP[mimeType] || 'png';
  }

  static createCloudinaryStorage(config: UploadConfig): StorageEngine {
    return new CloudinaryStorage({
      cloudinary,
      params: async (req: Request, file: Express.Multer.File) => {
        return {
          folder: config.folder || 'CarSalahakar',
          format: this.getMimeType(file.mimetype),
          public_id: `${Date.now()}-${path.parse(file.originalname).name}`,
        };
      },
    });
  }

  static createLocalStorage(uploadPath: string = 'uploads/'): StorageEngine {
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    return multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, uploadPath);
      },
      filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${path.parse(file.originalname).name}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
      },
    });
  }

  static createFileFilter(config: UploadConfig) {
    const allowedMimeTypes = config.allowedMimeTypes || this.DEFAULT_ALLOWED_MIME_TYPES;

    return (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
      const isAllowed = allowedMimeTypes.some(type => {
        if (type === 'image/*') {
          return file.mimetype.startsWith('image/');
        }
        return file.mimetype === type;
      });

      if (isAllowed) {
        cb(null, true);
      } else {
        cb(new AppError(`Invalid file type. Allowed types: ${allowedMimeTypes.join(', ')}`, 400));
      }
    };
  }

  static createUploadMiddleware(config: UploadConfig) {
    const storage = config.useCloudinary !== false
      ? this.createCloudinaryStorage(config)
      : this.createLocalStorage();

    const fileFilter = this.createFileFilter(config);

    const limits = {
      fileSize: config.maxFileSize || this.DEFAULT_MAX_FILE_SIZE,
    };

    // Handle multiple file fields (e.g., thumbnail, linkImage, images)
    if (config.fields && config.fields.length > 0) {
      return multer({ storage, fileFilter, limits }).fields(config.fields);
    }

    // Handle array of files for a single field
    if (config.maxFiles && config.maxFiles > 1) {
      return multer({ storage, fileFilter, limits }).array(config.fieldName, config.maxFiles);
    }

    // Handle single file upload
    return multer({ storage, fileFilter, limits }).single(config.fieldName);
  }

  static async deleteFromCloudinary(publicId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      if (result.result === 'ok' || result.result === 'not found') {
        return { success: true };
      }
      return { success: false, error: result.result };
    } catch (error) {
      console.error('Error deleting from Cloudinary:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  static async deleteLocalFile(filePath: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return { success: true };
      }
      return { success: false, error: 'File not found' };
    } catch (error) {
      console.error('Error deleting local file:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  static formatUploadedFile(file: Express.Multer.File): UploadedFile {
    const localFile = file as Express.Multer.File & { path?: string };
    const cloudinaryFile = file as Express.Multer.File & { secure_url?: string; public_id?: string };

    if (cloudinaryFile.secure_url) {
      return {
        url: cloudinaryFile.secure_url,
        publicId: cloudinaryFile.public_id,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
      };
    }

    if (localFile.path) {
      return {
        url: localFile.path,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
      };
    }

    return {
      url: '',
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    };
  }

  /**
   * Cleanup uploaded files if database operation fails
   * This should be called in a catch block after failed DB operations
   */
  static async cleanupFailedUpload(uploadedFile: UploadedFile): Promise<void> {
    if (uploadedFile.publicId) {
      await this.deleteFromCloudinary(uploadedFile.publicId);
    } else if (uploadedFile.url && !uploadedFile.url.startsWith('http')) {
      // Local file path
      await this.deleteLocalFile(uploadedFile.url);
    }
  }

  /**
   * Cleanup multiple uploaded files if database operation fails
   */
  static async cleanupFailedUploads(uploadedFiles: UploadedFile[]): Promise<void> {
    await Promise.all(
      uploadedFiles.map(file => this.cleanupFailedUpload(file))
    );
  }
}

export default UploadService;
