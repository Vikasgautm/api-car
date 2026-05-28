"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImageService = void 0;
const image_model_1 = require("../../../models/image.model");
const upload_service_1 = require("../../../shared/services/upload.service");
const app_error_util_1 = require("../../../shared/utils/app-error.util");
const filter_util_1 = require("../../../shared/utils/filter.util");
const pagination_util_1 = require("../../../shared/utils/pagination.util");
const logger_1 = require("../../../utils/logger");
class ImageService {
    static async getAllImages(filterDto, includeDeleted = false) {
        const { page = 1, limit = 20, folder, mime_type, tags, sortBy = 'createdAt', sortOrder = 'desc', } = filterDto;
        const filter = {};
        if (!includeDeleted) {
            filter.is_deleted = false;
        }
        if (folder)
            filter.folder = folder;
        if (mime_type)
            filter.mime_type = mime_type;
        if (tags) {
            const tagArray = Array.isArray(tags) ? tags : tags.split(',');
            filter.tags = { $in: tagArray };
        }
        const { skip, limit: validatedLimit } = pagination_util_1.PaginationUtil.getPaginationParams(page, limit);
        const sortFilter = filter_util_1.FilterUtil.buildSortFilter(sortBy, sortOrder);
        const images = await image_model_1.Image.find(filter)
            .sort(sortFilter)
            .skip(skip)
            .limit(validatedLimit);
        const total = await image_model_1.Image.countDocuments(filter);
        const paginationMeta = pagination_util_1.PaginationUtil.createPaginationMeta(page, validatedLimit, total);
        return { images, pagination: paginationMeta };
    }
    static async getImageById(imageId) {
        const image = await image_model_1.Image.findById(imageId);
        if (!image) {
            throw new app_error_util_1.AppError('Image not found', 404);
        }
        return image;
    }
    static async createImage(imageData, uploadedBy) {
        const image = {
            url: imageData.url,
            public_id: imageData.publicId,
            original_name: imageData.originalName,
            mime_type: imageData.mimeType,
            size: imageData.size,
            folder: imageData.folder,
            alt_text: imageData.alt_text,
            caption: imageData.caption,
            tags: imageData.tags,
            uploaded_by: uploadedBy,
            is_deleted: false,
            metadata: imageData.metadata,
        };
        return await image_model_1.Image.create(image);
    }
    static async deleteImage(imageId) {
        const image = await image_model_1.Image.findById(imageId);
        if (!image) {
            throw new app_error_util_1.AppError('Image not found', 404);
        }
        // Delete from Cloudinary if public_id exists
        if (image.public_id) {
            try {
                await upload_service_1.UploadService.deleteFromCloudinary(image.public_id);
            }
            catch (error) {
                logger_1.logger.error('Error deleting from Cloudinary:', error);
                // Continue with DB deletion even if Cloudinary fails
            }
        }
        // Soft delete from DB
        await image_model_1.Image.findByIdAndUpdate(imageId, { is_deleted: true });
        return image;
    }
    static async restoreImage(imageId) {
        const image = await image_model_1.Image.findByIdAndUpdate(imageId, { is_deleted: false }, { returnDocument: 'after' });
        if (!image) {
            throw new app_error_util_1.AppError('Image not found', 404);
        }
        return image;
    }
    static async hardDeleteImage(imageId) {
        const image = await image_model_1.Image.findById(imageId);
        if (!image) {
            throw new app_error_util_1.AppError('Image not found', 404);
        }
        // Delete from Cloudinary if public_id exists
        if (image.public_id) {
            try {
                await upload_service_1.UploadService.deleteFromCloudinary(image.public_id);
            }
            catch (error) {
                logger_1.logger.error('Error deleting from Cloudinary:', error);
            }
        }
        // Hard delete from DB
        await image_model_1.Image.findByIdAndDelete(imageId);
        return image;
    }
    static async updateImage(imageId, imageData) {
        const updateData = {};
        if (imageData.alt_text !== undefined)
            updateData.alt_text = imageData.alt_text;
        if (imageData.caption !== undefined)
            updateData.caption = imageData.caption;
        if (imageData.tags !== undefined)
            updateData.tags = imageData.tags;
        if (imageData.metadata !== undefined)
            updateData.metadata = imageData.metadata;
        const image = await image_model_1.Image.findByIdAndUpdate(imageId, updateData, { returnDocument: 'after' });
        if (!image) {
            throw new app_error_util_1.AppError('Image not found', 404);
        }
        return image;
    }
    static async createImageWithCleanup(uploadedFile, additionalData, uploadedBy) {
        let savedImage = null;
        try {
            // Save to database
            savedImage = await this.createImage({
                ...uploadedFile,
                ...additionalData,
            }, uploadedBy);
            return savedImage;
        }
        catch (error) {
            // Cleanup: Delete from Cloudinary if DB save fails
            if (uploadedFile.publicId) {
                try {
                    await upload_service_1.UploadService.deleteFromCloudinary(uploadedFile.publicId);
                }
                catch (cleanupError) {
                    logger_1.logger.error('Error during cleanup after DB save failure:', cleanupError);
                }
            }
            // Re-throw the original error
            throw error;
        }
    }
    static async createMultipleImagesWithCleanup(uploadedFiles, additionalData, uploadedBy) {
        const savedImages = [];
        const failedFiles = [];
        // Batch create all images in parallel instead of sequential
        const createPromises = uploadedFiles.map(file => this.createImage({
            ...file,
            ...additionalData,
        }, uploadedBy).then(savedImage => ({
            success: true,
            file,
            savedImage,
        })).catch(error => ({
            success: false,
            file,
            error,
        })));
        const results = await Promise.all(createPromises);
        // Process results - separate successful from failed
        for (const result of results) {
            if (result.success && 'savedImage' in result) {
                savedImages.push(result.savedImage);
            }
            else {
                // Cleanup failed file from Cloudinary
                if (result.file.publicId) {
                    try {
                        await upload_service_1.UploadService.deleteFromCloudinary(result.file.publicId);
                    }
                    catch (cleanupError) {
                        logger_1.logger.error('Error during cleanup after DB save failure:', cleanupError);
                    }
                }
                failedFiles.push(result);
            }
        }
        // If any files failed, rollback all successfully saved images in parallel
        if (failedFiles.length > 0 && savedImages.length > 0) {
            // Parallelize Cloudinary deletions
            await Promise.all(savedImages
                .filter(image => image.public_id)
                .map(image => upload_service_1.UploadService.deleteFromCloudinary(image.public_id).catch(cleanupError => {
                logger_1.logger.error('Error during rollback cleanup:', cleanupError);
            })));
            // Batch delete images from DB instead of sequential deletes
            const imageIds = savedImages.map(image => image._id);
            if (imageIds.length > 0) {
                await image_model_1.Image.deleteMany({ _id: { $in: imageIds } });
            }
            throw new app_error_util_1.AppError(`Failed to save ${failedFiles.length} image(s). All uploads have been rolled back.`, 500);
        }
        return savedImages;
    }
}
exports.ImageService = ImageService;
//# sourceMappingURL=image.service.js.map