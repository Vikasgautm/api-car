"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CarImageService = void 0;
const cloudinary_1 = require("cloudinary");
const uuid_1 = require("uuid");
const car_image_model_1 = require("../../../models/car-image.model");
const car_variant_model_1 = require("../../../models/car-variant.model");
const car_model_1 = require("../../../models/car.model");
const image_category_model_1 = require("../../../models/image-category.model");
const image_subcategory_model_1 = require("../../../models/image-subcategory.model");
const app_error_util_1 = require("../../../shared/utils/app-error.util");
const filter_util_1 = require("../../../shared/utils/filter.util");
const pagination_util_1 = require("../../../shared/utils/pagination.util");
class CarImageService {
    static async getAllCarImages(filterDto, includeDeleted = false) {
        const { page = 1, limit = 10, car_id, variant_id, category_id, sub_category_id, is_published, is_primary, is_deleted, sortBy = 'display_order', sortOrder = 'asc', } = filterDto;
        const filter = {};
        if (is_deleted === 'true' || is_deleted === true) {
            filter.is_deleted = true;
        }
        else if (!includeDeleted) {
            filter.is_deleted = false;
        }
        if (car_id)
            filter.car_id = car_id;
        if (variant_id)
            filter.variant_id = variant_id;
        if (category_id)
            filter.category_id = category_id;
        if (sub_category_id)
            filter.sub_category_id = sub_category_id;
        if (is_published !== undefined)
            filter.is_published = is_published;
        if (is_primary !== undefined)
            filter.is_primary = is_primary;
        const { skip, limit: validatedLimit } = pagination_util_1.PaginationUtil.getPaginationParams(page, limit);
        const sortFilter = filter_util_1.FilterUtil.buildSortFilter(sortBy, sortOrder);
        const images = await car_image_model_1.CarImage.find(filter)
            .populate('car_id', 'name slug')
            .populate('variant_id', 'name slug')
            .populate('category_id', 'name slug')
            .populate('sub_category_id', 'name slug')
            .sort(sortFilter)
            .skip(skip)
            .limit(validatedLimit);
        const total = await car_image_model_1.CarImage.countDocuments(filter);
        const paginationMeta = pagination_util_1.PaginationUtil.createPaginationMeta(page, validatedLimit, total);
        return { images, pagination: paginationMeta };
    }
    static async getCarImageById(imageId) {
        return await car_image_model_1.CarImage.findById(imageId)
            .populate('car_id', 'name slug')
            .populate('variant_id', 'name slug')
            .populate('category_id', 'name slug')
            .populate('sub_category_id', 'name slug');
    }
    static async getPublicGallery(filterDto) {
        const { page = 1, limit = 20, car_id, category_id, sortBy = 'display_order', sortOrder = 'asc', } = filterDto;
        const filter = {
            is_published: true,
            is_deleted: false,
        };
        if (car_id)
            filter.car_id = car_id;
        if (category_id)
            filter.category_id = category_id;
        const { skip, limit: validatedLimit } = pagination_util_1.PaginationUtil.getPaginationParams(page, limit);
        const sortFilter = filter_util_1.FilterUtil.buildSortFilter(sortBy, sortOrder);
        const images = await car_image_model_1.CarImage.find(filter)
            .populate('car_id', 'name slug')
            .populate('category_id', 'name slug')
            .select('url thumbnail_url alt_text caption display_order')
            .sort(sortFilter)
            .skip(skip)
            .limit(validatedLimit)
            .lean();
        const total = await car_image_model_1.CarImage.countDocuments(filter);
        const paginationMeta = pagination_util_1.PaginationUtil.createPaginationMeta(page, validatedLimit, total);
        return { images, pagination: paginationMeta };
    }
    static async getCarGallery(carId) {
        const images = await car_image_model_1.CarImage.find({
            car_id: carId,
            is_published: true,
            is_deleted: false,
        })
            .populate('category_id', 'name slug')
            .populate('sub_category_id', 'name slug')
            .sort({ display_order: 1 });
        // Group by category
        const grouped = images.reduce((acc, img) => {
            const category = img.category_id?.name || 'Uncategorized';
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(img);
            return acc;
        }, {});
        return { images, grouped };
    }
    static async createCarImage(imageData, uploadedBy) {
        // Validate foreign keys in parallel
        const [car, variant, category, subcategory] = await Promise.all([
            imageData.car_id ? car_model_1.Car.findOne({ car_id: imageData.car_id }) : Promise.resolve(null),
            imageData.variant_id ? car_variant_model_1.CarVariant.findOne({ variant_id: imageData.variant_id }) : Promise.resolve(null),
            imageData.category_id ? image_category_model_1.ImageCategory.findById(imageData.category_id) : Promise.resolve(null),
            imageData.sub_category_id ? image_subcategory_model_1.ImageSubCategory.findById(imageData.sub_category_id) : Promise.resolve(null),
        ]);
        if (imageData.car_id && !car) {
            throw new app_error_util_1.AppError('Car not found', 404);
        }
        if (imageData.variant_id && !variant) {
            throw new app_error_util_1.AppError('Variant not found', 404);
        }
        if (imageData.category_id && !category) {
            throw new app_error_util_1.AppError('Image category not found', 404);
        }
        if (imageData.sub_category_id && !subcategory) {
            throw new app_error_util_1.AppError('Image subcategory not found', 404);
        }
        // If setting as primary, unset other primary images for this car
        if (imageData.is_primary && imageData.car_id) {
            await car_image_model_1.CarImage.updateMany({ car_id: imageData.car_id, is_primary: true, is_deleted: false }, { is_primary: false });
        }
        const image = {
            image_uuid: imageData.image_uuid || (0, uuid_1.v4)(),
            car_id: imageData.car_id,
            variant_id: imageData.variant_id,
            category_id: imageData.category_id,
            sub_category_id: imageData.sub_category_id,
            url: imageData.url,
            thumbnail_url: imageData.thumbnail_url,
            alt_text: imageData.alt_text,
            caption: imageData.caption,
            tags: imageData.tags,
            display_order: imageData.display_order || 0,
            is_primary: imageData.is_primary || false,
            is_published: imageData.is_published || false,
            is_deleted: false,
            source: imageData.source,
            car_condition: imageData.car_condition,
            taken_at: imageData.taken_at,
            uploaded_by: uploadedBy,
            damage_area: imageData.damage_area,
            damage_note: imageData.damage_note,
            inspection_severity: imageData.inspection_severity,
            metadata: imageData.metadata,
        };
        return await car_image_model_1.CarImage.create(image);
    }
    static async updateCarImage(imageId, imageData) {
        const updateData = {};
        // Validate foreign keys in parallel if being updated
        const [car, variant, category, subcategory] = await Promise.all([
            imageData.car_id !== undefined ? car_model_1.Car.findOne({ car_id: imageData.car_id }) : Promise.resolve(null),
            imageData.variant_id !== undefined ? car_variant_model_1.CarVariant.findOne({ variant_id: imageData.variant_id }) : Promise.resolve(null),
            imageData.category_id !== undefined ? image_category_model_1.ImageCategory.findById(imageData.category_id) : Promise.resolve(null),
            imageData.sub_category_id !== undefined ? image_subcategory_model_1.ImageSubCategory.findById(imageData.sub_category_id) : Promise.resolve(null),
        ]);
        if (imageData.car_id !== undefined && !car) {
            throw new app_error_util_1.AppError('Car not found', 404);
        }
        if (imageData.variant_id !== undefined && !variant) {
            throw new app_error_util_1.AppError('Variant not found', 404);
        }
        if (imageData.category_id !== undefined && !category) {
            throw new app_error_util_1.AppError('Image category not found', 404);
        }
        if (imageData.sub_category_id !== undefined && !subcategory) {
            throw new app_error_util_1.AppError('Image subcategory not found', 404);
        }
        if (imageData.car_id !== undefined)
            updateData.car_id = imageData.car_id;
        if (imageData.variant_id !== undefined)
            updateData.variant_id = imageData.variant_id;
        if (imageData.category_id !== undefined)
            updateData.category_id = imageData.category_id;
        if (imageData.sub_category_id !== undefined)
            updateData.sub_category_id = imageData.sub_category_id;
        if (imageData.url !== undefined)
            updateData.url = imageData.url;
        if (imageData.thumbnail_url !== undefined)
            updateData.thumbnail_url = imageData.thumbnail_url;
        if (imageData.alt_text !== undefined)
            updateData.alt_text = imageData.alt_text;
        if (imageData.caption !== undefined)
            updateData.caption = imageData.caption;
        if (imageData.tags !== undefined)
            updateData.tags = imageData.tags;
        if (imageData.display_order !== undefined)
            updateData.display_order = imageData.display_order;
        if (imageData.is_published !== undefined)
            updateData.is_published = imageData.is_published;
        if (imageData.is_primary !== undefined) {
            // If setting as primary, unset other primary images for this car
            const existingImage = await car_image_model_1.CarImage.findById(imageId);
            if (existingImage && existingImage.car_id && imageData.is_primary) {
                await car_image_model_1.CarImage.updateMany({ car_id: existingImage.car_id, is_primary: true, is_deleted: false, _id: { $ne: imageId } }, { is_primary: false });
            }
            updateData.is_primary = imageData.is_primary;
        }
        if (imageData.source !== undefined)
            updateData.source = imageData.source;
        if (imageData.car_condition !== undefined)
            updateData.car_condition = imageData.car_condition;
        if (imageData.taken_at !== undefined)
            updateData.taken_at = imageData.taken_at;
        if (imageData.damage_area !== undefined)
            updateData.damage_area = imageData.damage_area;
        if (imageData.damage_note !== undefined)
            updateData.damage_note = imageData.damage_note;
        if (imageData.inspection_severity !== undefined)
            updateData.inspection_severity = imageData.inspection_severity;
        if (imageData.metadata !== undefined)
            updateData.metadata = imageData.metadata;
        const image = await car_image_model_1.CarImage.findByIdAndUpdate(imageId, updateData, { returnDocument: 'after' });
        if (!image) {
            throw new app_error_util_1.AppError('Car image not found', 404);
        }
        return image;
    }
    static async deleteCarImage(imageId) {
        const image = await car_image_model_1.CarImage.findById(imageId);
        if (!image) {
            throw new app_error_util_1.AppError('Car image not found', 404);
        }
        // Delete from Cloudinary
        try {
            const publicId = this.extractPublicId(image.url);
            if (publicId) {
                await cloudinary_1.v2.uploader.destroy(publicId);
            }
            if (image.thumbnail_url) {
                const thumbnailPublicId = this.extractPublicId(image.thumbnail_url);
                if (thumbnailPublicId) {
                    await cloudinary_1.v2.uploader.destroy(thumbnailPublicId);
                }
            }
        }
        catch (error) {
            console.error('Error deleting from Cloudinary:', error);
            // Continue with DB deletion even if Cloudinary fails
        }
        // Soft delete from DB
        await car_image_model_1.CarImage.findByIdAndUpdate(imageId, { is_deleted: true });
        return image;
    }
    static async restoreCarImage(imageId) {
        const image = await car_image_model_1.CarImage.findByIdAndUpdate(imageId, { is_deleted: false }, { returnDocument: 'after' });
        if (!image) {
            throw new app_error_util_1.AppError('Car image not found', 404);
        }
        return image;
    }
    static async togglePublish(imageId) {
        const image = await car_image_model_1.CarImage.findById(imageId);
        if (!image) {
            throw new app_error_util_1.AppError('Car image not found', 404);
        }
        image.is_published = !image.is_published;
        await image.save();
        return image;
    }
    static async setPrimaryImage(imageId) {
        const image = await car_image_model_1.CarImage.findById(imageId);
        if (!image) {
            throw new app_error_util_1.AppError('Car image not found', 404);
        }
        if (!image.car_id) {
            throw new app_error_util_1.AppError('Image must be associated with a car to be set as primary', 400);
        }
        // Unset other primary images for this car
        await car_image_model_1.CarImage.updateMany({ car_id: image.car_id, is_primary: true, is_deleted: false, _id: { $ne: imageId } }, { is_primary: false });
        // Set this image as primary
        image.is_primary = true;
        await image.save();
        return image;
    }
    static extractPublicId(url) {
        if (!url)
            return null;
        // Cloudinary URL format: https://res.cloudinary.com/cloud_name/image/upload/v1234567890/folder/public_id.ext
        const match = url.match(/\/v\d+\/(.+)\.\w+$/);
        return match ? match[1] : null;
    }
}
exports.CarImageService = CarImageService;
//# sourceMappingURL=car-image.service.js.map