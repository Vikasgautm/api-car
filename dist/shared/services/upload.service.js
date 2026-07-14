"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadService = void 0;
const fs_1 = __importDefault(require("fs"));
const multer_1 = __importDefault(require("multer"));
const client_s3_1 = require("@aws-sdk/client-s3");
const multer_s3_1 = __importDefault(require("multer-s3"));
const path_1 = __importDefault(require("path"));
const config_1 = require("../../config");
const app_error_util_1 = require("../utils/app-error.util");
// Initialize S3 Client
const s3 = new client_s3_1.S3Client({
    credentials: {
        accessKeyId: config_1.config.aws_access_key_id || '',
        secretAccessKey: config_1.config.aws_secret_access_key || '',
    },
    region: config_1.config.aws_region || 'us-east-1',
});
async function determineS3Folder(req, configObj) {
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
            }
            catch (err) {
                console.error('S3 folder brand resolution error:', err);
            }
        }
        else if (req.body) {
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
            }
            catch (err) {
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
            }
            catch (err) {
                console.error('S3 folder join query resolution error:', err);
            }
        }
        else if (req.body) {
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
                }
                catch (err) {
                    console.error('S3 folder brand resolution from body brand_id error:', err);
                }
            }
        }
        return `brands/${brandSlug}/cars/${carSlug}`;
    }
    return folderType;
}
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
    static createS3Storage(configObj) {
        return (0, multer_s3_1.default)({
            s3: s3,
            bucket: config_1.config.aws_bucket_name || '',
            metadata: (req, file, cb) => {
                cb(null, { fieldName: file.fieldname });
            },
            key: (req, file, cb) => {
                const uniqueName = `${Date.now()}-${path_1.default.parse(file.originalname).name}${path_1.default.extname(file.originalname)}`;
                determineS3Folder(req, configObj)
                    .then(folderPath => {
                    cb(null, `${folderPath}/${uniqueName}`);
                })
                    .catch(err => {
                    cb(err);
                });
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
    static createUploadMiddleware(configObj) {
        let storage;
        if (config_1.config.aws_access_key_id && config_1.config.aws_bucket_name) {
            storage = this.createS3Storage(configObj);
        }
        else {
            storage = this.createLocalStorage();
        }
        const fileFilter = this.createFileFilter(configObj);
        const limits = {
            fileSize: configObj.maxFileSize || this.DEFAULT_MAX_FILE_SIZE,
        };
        let upload;
        if (configObj.fields && configObj.fields.length > 0) {
            upload = (0, multer_1.default)({ storage, fileFilter, limits }).fields(configObj.fields);
        }
        else if (configObj.maxFiles && configObj.maxFiles > 1) {
            upload = (0, multer_1.default)({ storage, fileFilter, limits }).array(configObj.fieldName, configObj.maxFiles);
        }
        else {
            upload = (0, multer_1.default)({ storage, fileFilter, limits }).single(configObj.fieldName);
        }
        return (req, res, next) => {
            upload(req, res, (err) => {
                if (err) {
                    return next(err);
                }
                // Post-process S3 files to populate secure_url and public_id
                const patchFile = (file) => {
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
                    }
                    else if (typeof req.files === 'object') {
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
    static async deleteFromS3(key) {
        try {
            const command = new client_s3_1.DeleteObjectCommand({
                Bucket: config_1.config.aws_bucket_name || '',
                Key: key,
            });
            await s3.send(command);
            return { success: true };
        }
        catch (error) {
            console.error('Error deleting from S3:', error);
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
        const s3File = file;
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
    static async cleanupFailedUpload(uploadedFile) {
        if (uploadedFile.publicId) {
            if (uploadedFile.url.includes('.amazonaws.com') || uploadedFile.url.includes('s3.amazonaws.com') || uploadedFile.publicId.includes('/')) {
                await this.deleteFromS3(uploadedFile.publicId);
            }
            else {
                await this.deleteLocalFile(uploadedFile.publicId);
            }
        }
        else if (uploadedFile.url && !uploadedFile.url.startsWith('http')) {
            await this.deleteLocalFile(uploadedFile.url);
        }
    }
    static async cleanupFailedUploads(uploadedFiles) {
        await Promise.all(uploadedFiles.map(file => this.cleanupFailedUpload(file)));
    }
}
exports.UploadService = UploadService;
exports.default = UploadService;
