"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImageController = void 0;
const upload_service_1 = require("../../../shared/services/upload.service");
const response_util_1 = require("../../../shared/utils/response.util");
const catchAsync_1 = require("../../../utils/catchAsync");
const image_service_1 = require("../services/image.service");
class ImageController {
    static uploadImage = (0, catchAsync_1.catchAsync)(async (req, res) => {
        if (!req.file) {
            return response_util_1.ResponseUtil.error(res, 'No file uploaded', 400);
        }
        const uploadedFile = upload_service_1.UploadService.formatUploadedFile(req.file);
        const image = {
            url: uploadedFile.url,
            publicId: uploadedFile.publicId,
            originalName: uploadedFile.originalName,
            mimeType: uploadedFile.mimeType,
            size: uploadedFile.size,
        };
        return response_util_1.ResponseUtil.success(res, image, 'Image uploaded successfully');
    });
    static uploadImageWithSave = (0, catchAsync_1.catchAsync)(async (req, res) => {
        if (!req.file) {
            return response_util_1.ResponseUtil.error(res, 'No file uploaded', 400);
        }
        const uploadedFile = upload_service_1.UploadService.formatUploadedFile(req.file);
        const uploadedBy = req.user?.user_id || req.user?.id;
        const image = await image_service_1.ImageService.createImageWithCleanup(uploadedFile, {
            alt_text: req.body.alt_text,
            caption: req.body.caption,
            tags: req.body.tags ? (Array.isArray(req.body.tags) ? req.body.tags : req.body.tags.split(',')) : undefined,
            folder: req.body.folder,
        }, uploadedBy);
        return response_util_1.ResponseUtil.created(res, image, 'Image uploaded and saved successfully');
    });
    static uploadMultipleImages = (0, catchAsync_1.catchAsync)(async (req, res) => {
        if (!req.files || req.files.length === 0) {
            return response_util_1.ResponseUtil.error(res, 'No files uploaded', 400);
        }
        const images = req.files.map((file) => {
            const uploadedFile = upload_service_1.UploadService.formatUploadedFile(file);
            return {
                url: uploadedFile.url,
                publicId: uploadedFile.publicId,
                originalName: uploadedFile.originalName,
                mimeType: uploadedFile.mimeType,
                size: uploadedFile.size,
            };
        });
        return response_util_1.ResponseUtil.success(res, { images }, `${images.length} images uploaded successfully`);
    });
    static uploadMultipleImagesWithSave = (0, catchAsync_1.catchAsync)(async (req, res) => {
        if (!req.files || req.files.length === 0) {
            return response_util_1.ResponseUtil.error(res, 'No files uploaded', 400);
        }
        const uploadedFiles = req.files.map((file) => upload_service_1.UploadService.formatUploadedFile(file));
        const uploadedBy = req.user?.user_id || req.user?.id;
        const images = await image_service_1.ImageService.createMultipleImagesWithCleanup(uploadedFiles, {
            alt_text: req.body.alt_text,
            caption: req.body.caption,
            tags: req.body.tags ? (Array.isArray(req.body.tags) ? req.body.tags : req.body.tags.split(',')) : undefined,
            folder: req.body.folder,
        }, uploadedBy);
        return response_util_1.ResponseUtil.created(res, { images }, `${images.length} images uploaded and saved successfully`);
    });
    static listImages = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const result = await image_service_1.ImageService.getAllImages(req.query, false);
        return response_util_1.ResponseUtil.paginated(res, result.images, result.pagination, 'Images retrieved successfully');
    });
    static getImage = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const image = await image_service_1.ImageService.getImageById(req.params.id);
        return response_util_1.ResponseUtil.success(res, image, 'Image retrieved successfully');
    });
    static deleteImage = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const image = await image_service_1.ImageService.deleteImage(req.params.id);
        return response_util_1.ResponseUtil.success(res, image, 'Image deleted successfully');
    });
    static updateImage = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const image = await image_service_1.ImageService.updateImage(req.params.id, req.body);
        return response_util_1.ResponseUtil.success(res, image, 'Image updated successfully');
    });
}
exports.ImageController = ImageController;
