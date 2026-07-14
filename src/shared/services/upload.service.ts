import { Request } from 'express';
import fs from 'fs';
import multer, { FileFilterCallback, StorageEngine } from 'multer';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import multerS3 from 'multer-s3';
import path from 'path';
import { config } from '../../config';
import { AppError } from '../utils/app-error.util';

// Initialize S3 Client
const s3 = new S3Client({
  credentials: {
    accessKeyId: config.aws_access_key_id || '',
    secretAccessKey: config.aws_secret_access_key || '',
  },
  region: config.aws_region || 'us-east-1',
});

export interface UploadConfig {
  fieldName: string;
  maxFileSize?: number;
  allowedMimeTypes?: string[];
  maxFiles?: number;
  useCloudinary?: boolean; // Kept for interface compatibility
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

async function determineS3Folder(req: Request, configObj: UploadConfig): Promise<string> {
  const folderType = configObj.folder || 'general';

  if (folderType === 'brands') {
    let brandSlug = 'unknown-brand';
    const brandId = req.params?.id || req.body?.brand_id;
    if (brandId) {
      try {
        const { Brand } = require('../../../models/brand.model');
        const brand = await Brand.findOne({ brand_id: brandId });
        if (brand && brand.slug) {
          brandSlug = brand.slug;
        }
      } catch (err) {
        console.error('S3 folder brand resolution error:', err);
      }
    } else if (req.body) {
      const slugify = require('slugify');
      const nameOrSlug = req.body.slug || req.body.name;
      if (nameOrSlug) {
        brandSlug = slugify(nameOrSlug, { lower: true, strict: true });
      }
    }
    return `brands/${brandSlug}`;
  }

  if (folderType === 'cars' || folderType === 'car-images') {
    let brandSlug = 'unknown-brand';
    let carSlug = 'unknown-car';

    let carId = req.body?.car_id || req.params?.carId;
    if (!carId && req.params?.id && folderType === 'car-images') {
      try {
        const { getPool } = require('../../../sql/utils/dbConnection');
        const pool = await getPool();
        const res = await pool.request()
          .input('image_id', 'NVarChar', req.params.id)
          .query('SELECT car_id FROM CarImages WHERE image_id = @image_id');
        if (res.recordset && res.recordset[0]) {
          carId = res.recordset[0].car_id;
        }
      } catch (err) {
        console.error('S3 folder car-image resolution error:', err);
      }
    }

    if (!carId && req.params?.id && folderType === 'cars') {
      carId = req.params.id;
    }

    if (carId) {
      try {
        const { getPool } = require('../../../sql/utils/dbConnection');
        const pool = await getPool();
        const res = await pool.request()
          .input('car_id', 'NVarChar', carId)
          .query('SELECT c.slug as car_slug, b.slug as brand_slug FROM Cars c JOIN Brands b ON c.brand_id = b.brand_id WHERE c.car_id = @car_id');
        if (res.recordset && res.recordset[0]) {
          carSlug = res.recordset[0].car_slug || 'unknown-car';
          brandSlug = res.recordset[0].brand_slug || 'unknown-brand';
        }
      } catch (err) {
        console.error('S3 folder join query resolution error:', err);
      }
    } else if (req.body) {
      const slugify = require('slugify');
      if (req.body.name || req.body.slug) {
        carSlug = req.body.slug || slugify(req.body.name, { lower: true, strict: true });
      }
      const brandId = req.body.brand_id;
      if (brandId) {
        try {
          const { Brand } = require('../../../models/brand.model');
          const brand = await Brand.findOne({ brand_id: brandId });
          if (brand && brand.slug) {
            brandSlug = brand.slug;
          }
        } catch (err) {
          console.error('S3 folder brand resolution from body brand_id error:', err);
        }
      }
    }

    return `brands/${brandSlug}/cars/${carSlug}`;
  }

  return folderType;
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

  static createS3Storage(configObj: UploadConfig): StorageEngine {
    return multerS3({
      s3: s3,
      bucket: config.aws_bucket_name || '',
      metadata: (req, file, cb) => {
        cb(null, { fieldName: file.fieldname });
      },
      key: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${path.parse(file.originalname).name}${path.extname(file.originalname)}`;
        determineS3Folder(req as Request, configObj)
          .then(folderPath => {
            cb(null, `${folderPath}/${uniqueName}`);
          })
          .catch(err => {
            cb(err);
          });
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
        cb(AppError.invalidFileType(allowedMimeTypes));
      }
    };
  }

  static createUploadMiddleware(configObj: UploadConfig) {
    let storage: StorageEngine;

    if (config.aws_access_key_id && config.aws_bucket_name) {
      storage = this.createS3Storage(configObj);
    } else {
      storage = this.createLocalStorage();
    }

    const fileFilter = this.createFileFilter(configObj);

    const limits = {
      fileSize: configObj.maxFileSize || this.DEFAULT_MAX_FILE_SIZE,
    };

    let upload: any;
    if (configObj.fields && configObj.fields.length > 0) {
      upload = multer({ storage, fileFilter, limits }).fields(configObj.fields);
    } else if (configObj.maxFiles && configObj.maxFiles > 1) {
      upload = multer({ storage, fileFilter, limits }).array(configObj.fieldName, configObj.maxFiles);
    } else {
      upload = multer({ storage, fileFilter, limits }).single(configObj.fieldName);
    }

    return (req: Request, res: any, next: any) => {
      upload(req, res, (err: any) => {
        if (err) {
          return next(err);
        }

        // Post-process S3 files to populate secure_url and public_id
        const patchFile = (file: any) => {
          if (file && file.location) {
            file.secure_url = file.location;
            file.public_id = file.key;
          }
        };

        if (req.file) {
          patchFile(req.file);
        }

        if (req.files) {
          if (Array.isArray(req.files)) {
            req.files.forEach(patchFile);
          } else if (typeof req.files === 'object') {
            for (const key of Object.keys(req.files)) {
              const filesArray = req.files[key];
              if (Array.isArray(filesArray)) {
                filesArray.forEach(patchFile);
              }
            }
          }
        }

        next();
      });
    };
  }

  static async deleteFromS3(key: string): Promise<{ success: boolean; error?: string }> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: config.aws_bucket_name || '',
        Key: key,
      });
      await s3.send(command);
      return { success: true };
    } catch (error) {
      console.error('Error deleting from S3:', error);
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
    const s3File = file as any;

    if (s3File.location) {
      return {
        url: s3File.location,
        publicId: s3File.key,
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

  static async cleanupFailedUpload(uploadedFile: UploadedFile): Promise<void> {
    if (uploadedFile.publicId) {
      if (uploadedFile.url.includes('.amazonaws.com') || uploadedFile.url.includes('s3.amazonaws.com') || uploadedFile.publicId.includes('/')) {
        await this.deleteFromS3(uploadedFile.publicId);
      } else {
        await this.deleteLocalFile(uploadedFile.publicId);
      }
    } else if (uploadedFile.url && !uploadedFile.url.startsWith('http')) {
      await this.deleteLocalFile(uploadedFile.url);
    }
  }

  static async cleanupFailedUploads(uploadedFiles: UploadedFile[]): Promise<void> {
    await Promise.all(
      uploadedFiles.map(file => this.cleanupFailedUpload(file))
    );
  }
}

export default UploadService;
