"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadService = void 0;
const cloudinary_1 = require("cloudinary");
const fs_1 = __importDefault(require("fs"));
const multer_1 = __importDefault(require("multer"));
const multer_storage_cloudinary_1 = require("multer-storage-cloudinary");
const path_1 = __importDefault(require("path"));
const config_1 = require("../../config");
const app_error_util_1 = require("../utils/app-error.util");
cloudinary_1.v2.config({
    cloud_name: config_1.config.cloudinary_cloud_name,
    api_key: config_1.config.cloudinary_api_key,
    api_secret: config_1.config.cloudinary_api_secret,
});
class UploadService {
    static DEFAULT_MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    static DEFAULT_ALLOWED_MIME_TYPES = [
        'image/*',
    ];
    static MIME_TYPE_MAP = {
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
    static getMimeType(mimeType) {
        return this.MIME_TYPE_MAP[mimeType] || 'png';
    }
    static createCloudinaryStorage(config) {
        return new multer_storage_cloudinary_1.CloudinaryStorage({
            cloudinary: cloudinary_1.v2,
            params: async (req, file) => {
                return {
                    folder: config.folder || 'CarSalahakar',
                    format: this.getMimeType(file.mimetype),
                    public_id: `${Date.now()}-${path_1.default.parse(file.originalname).name}`,
                };
            },
        });
    }
    static createLocalStorage(uploadPath = 'uploads/') {
        if (!fs_1.default.existsSync(uploadPath)) {
            fs_1.default.mkdirSync(uploadPath, { recursive: true });
        }
        return multer_1.default.diskStorage({
            destination: (req, file, cb) => {
                cb(null, uploadPath);
            },
            filename: (req, file, cb) => {
                const uniqueName = `${Date.now()}-${path_1.default.parse(file.originalname).name}${path_1.default.extname(file.originalname)}`;
                cb(null, uniqueName);
            },
        });
    }
    static createFileFilter(config) {
        const allowedMimeTypes = config.allowedMimeTypes || this.DEFAULT_ALLOWED_MIME_TYPES;
        return (req, file, cb) => {
            const isAllowed = allowedMimeTypes.some(type => {
                if (type === 'image/*') {
                    return file.mimetype.startsWith('image/');
                }
                return file.mimetype === type;
            });
            if (isAllowed) {
                cb(null, true);
            }
            else {
                cb(app_error_util_1.AppError.invalidFileType(allowedMimeTypes));
            }
        };
    }
    static createUploadMiddleware(config) {
        const storage = config.useCloudinary !== false
            ? this.createCloudinaryStorage(config)
            : this.createLocalStorage();
        const fileFilter = this.createFileFilter(config);
        const limits = {
            fileSize: config.maxFileSize || this.DEFAULT_MAX_FILE_SIZE,
        };
        // Handle multiple file fields (e.g., thumbnail, linkImage, images)
        if (config.fields && config.fields.length > 0) {
            return (0, multer_1.default)({ storage, fileFilter, limits }).fields(config.fields);
        }
        // Handle array of files for a single field
        if (config.maxFiles && config.maxFiles > 1) {
            return (0, multer_1.default)({ storage, fileFilter, limits }).array(config.fieldName, config.maxFiles);
        }
        // Handle single file upload
        return (0, multer_1.default)({ storage, fileFilter, limits }).single(config.fieldName);
    }
    static async deleteFromCloudinary(publicId) {
        try {
            const result = await cloudinary_1.v2.uploader.destroy(publicId);
            if (result.result === 'ok' || result.result === 'not found') {
                return { success: true };
            }
            return { success: false, error: result.result };
        }
        catch (error) {
            console.error('Error deleting from Cloudinary:', error);
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    }
    static async deleteLocalFile(filePath) {
        try {
            if (fs_1.default.existsSync(filePath)) {
                fs_1.default.unlinkSync(filePath);
                return { success: true };
            }
            return { success: false, error: 'File not found' };
        }
        catch (error) {
            console.error('Error deleting local file:', error);
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    }
    static formatUploadedFile(file) {
        const localFile = file;
        const cloudinaryFile = file;
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
    static async cleanupFailedUpload(uploadedFile) {
        if (uploadedFile.publicId) {
            await this.deleteFromCloudinary(uploadedFile.publicId);
        }
        else if (uploadedFile.url && !uploadedFile.url.startsWith('http')) {
            // Local file path
            await this.deleteLocalFile(uploadedFile.url);
        }
    }
    /**
     * Cleanup multiple uploaded files if database operation fails
     */
    static async cleanupFailedUploads(uploadedFiles) {
        await Promise.all(uploadedFiles.map(file => this.cleanupFailedUpload(file)));
    }
}
exports.UploadService = UploadService;
exports.default = UploadService;
//# sourceMappingURL=upload.service.js.map