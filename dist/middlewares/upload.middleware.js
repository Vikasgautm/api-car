"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadFields = exports.uploadMultiple = exports.uploadSingle = exports.upload = exports.createUploadMiddleware = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
const app_error_util_1 = require("../shared/utils/app-error.util");
const defaultConfig = {
    destination: 'public/uploads/',
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
    maxFiles: 5,
};
const createUploadMiddleware = (config = {}) => {
    const mergedConfig = { ...defaultConfig, ...config };
    const storage = multer_1.default.diskStorage({
        destination: (req, file, cb) => {
            cb(null, mergedConfig.destination || 'public/uploads/');
        },
        filename: (req, file, cb) => {
            const uniqueName = `${(0, uuid_1.v4)()}${path_1.default.extname(file.originalname)}`;
            cb(null, uniqueName);
        },
    });
    const fileFilter = (req, file, cb) => {
        if (mergedConfig.allowedMimeTypes && mergedConfig.allowedMimeTypes.length > 0) {
            if (!mergedConfig.allowedMimeTypes.includes(file.mimetype)) {
                return cb(app_error_util_1.AppError.invalidFileType(mergedConfig.allowedMimeTypes), false);
            }
        }
        cb(null, true);
    };
    return (0, multer_1.default)({
        storage,
        fileFilter,
        limits: {
            fileSize: mergedConfig.maxFileSize,
            files: mergedConfig.maxFiles,
        },
    });
};
exports.createUploadMiddleware = createUploadMiddleware;
// Default upload middleware with default configuration
exports.upload = (0, exports.createUploadMiddleware)();
// Convenience methods
const uploadSingle = (fieldName, config) => (0, exports.createUploadMiddleware)(config).single(fieldName);
exports.uploadSingle = uploadSingle;
const uploadMultiple = (fieldName, maxCount = 5, config) => (0, exports.createUploadMiddleware)({ ...config, maxFiles: maxCount }).array(fieldName, maxCount);
exports.uploadMultiple = uploadMultiple;
const uploadFields = (fields, config) => (0, exports.createUploadMiddleware)(config).fields(fields);
exports.uploadFields = uploadFields;
