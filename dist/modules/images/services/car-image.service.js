"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CarImageService = void 0;
const upload_service_1 = require("../../../shared/services/upload.service");
const uuid_1 = require("uuid");
const car_image_model_1 = require("../../../models/car-image.model");
const car_variant_model_1 = require("../../../models/car-variant.model");
const car_model_1 = require("../../../models/car.model");
const brand_model_1 = require("../../../models/brand.model");
const media_constants_1 = require("../../../shared/services/media/media-constants");
const media_seo_service_1 = require("../../../shared/services/media/media-seo.service");
const media_priority_service_1 = require("../../../shared/services/media/media-priority.service");
const media_fallback_service_1 = require("../../../shared/services/media/media-fallback.service");
const app_error_util_1 = require("../../../shared/utils/app-error.util");
const filter_util_1 = require("../../../shared/utils/filter.util");
const pagination_util_1 = require("../../../shared/utils/pagination.util");
// ─── Private helpers ──────────────────────────────────────────────────────────
function extractS3Key(url) {
    if (!url)
        return null;
    if (!url.startsWith('http'))
        return null;
    try {
        const parsed = new URL(url);
        return decodeURIComponent(parsed.pathname.substring(1));
    }
    catch (err) {
        return null;
    }
}
async function getCarName(carId) {
    // brand_id is a plain string key, not a Mongoose ref, so .populate() throws
    // StrictPopulateError. Resolve the brand with a follow-up findOne.
    const car = await car_model_1.Car.findOne({ car_id: carId }).select('name brand_id').lean();
    if (!car)
        return '';
    let brandName = '';
    if (car.brand_id) {
        const brand = await brand_model_1.Brand.findOne({ brand_id: car.brand_id }).select('name').lean();
        brandName = brand?.name || '';
    }
    return brandName ? `${brandName} ${car.name}` : car.name;
}
/** Synchronise is_published / is_deleted booleans with status field */
function deriveStatusFlags(status) {
    return {
        is_published: status === 'published',
        is_deleted: status === 'rejected',
    };
}
/** Map legacy is_published boolean to a status value on ingest */
function inferStatus(data) {
    if (data.status)
        return data.status;
    if (data.is_deleted)
        return 'rejected';
    if (data.is_published)
        return 'published';
    return 'draft';
}
// ─── Service ──────────────────────────────────────────────────────────────────
class CarImageService {
    // ─── List ───────────────────────────────────────────────────────────────────
    static async getAllCarImages(filterDto, includeDeleted = false) {
        const { page = 1, limit = 20, car_id, variant_id, category_id, sub_category_id, main_category, sub_category, media_scope, status, is_published, is_primary, is_deleted, sortBy = 'sort_order', sortOrder = 'asc', } = filterDto;
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
        if (main_category)
            filter.main_category = main_category;
        if (sub_category)
            filter.sub_category = sub_category;
        if (media_scope)
            filter.media_scope = media_scope;
        if (status)
            filter.status = status;
        if (is_published !== undefined)
            filter.is_published = is_published;
        if (is_primary !== undefined)
            filter.is_primary = is_primary;
        const { skip, limit: validatedLimit } = pagination_util_1.PaginationUtil.getPaginationParams(page, limit);
        const sortFilter = filter_util_1.FilterUtil.buildSortFilter(sortBy, sortOrder);
        const images = await car_image_model_1.CarImage.find(filter)
            .sort(sortFilter)
            .skip(skip)
            .limit(validatedLimit);
        const total = await car_image_model_1.CarImage.countDocuments(filter);
        return { images, pagination: pagination_util_1.PaginationUtil.createPaginationMeta(page, validatedLimit, total) };
    }
    // ─── Single ─────────────────────────────────────────────────────────────────
    static async getCarImageById(imageId) {
        return car_image_model_1.CarImage.findById(imageId);
    }
    // ─── Category-specific retrieval ────────────────────────────────────────────
    static async getImagesByCategory(carId, mainCategory, subCategory) {
        const filter = {
            car_id: carId,
            main_category: mainCategory,
            status: 'published',
            is_deleted: false,
        };
        if (subCategory)
            filter.sub_category = subCategory;
        const images = await car_image_model_1.CarImage.find(filter)
            .sort({ sort_order: 1 })
            .lean();
        return media_priority_service_1.MediaPriorityService.sortByPriority(images, mainCategory);
    }
    // ─── Primary image with fallback ────────────────────────────────────────────
    static async getPrimaryWithFallback(carId) {
        const primary = await car_image_model_1.CarImage.findOne({
            car_id: carId,
            is_primary: true,
            is_deleted: false,
        }).lean();
        if (primary)
            return { image: primary, level: 'primary' };
        const fallback = await media_fallback_service_1.MediaFallbackService.resolveImage(carId);
        return { image: null, fallback, level: fallback.level };
    }
    // ─── Public gallery ─────────────────────────────────────────────────────────
    static async getPublicGallery(filterDto) {
        const { page = 1, limit = 20, car_id, main_category, sortBy = 'sort_order', sortOrder = 'asc', } = filterDto;
        const filter = {
            status: 'published',
            is_deleted: false,
        };
        if (car_id)
            filter.car_id = car_id;
        if (main_category)
            filter.main_category = main_category;
        const { skip, limit: validatedLimit } = pagination_util_1.PaginationUtil.getPaginationParams(page, limit);
        const images = await car_image_model_1.CarImage.find(filter)
            .select('url alt_text image_title main_category sub_category sort_order is_primary')
            .sort(filter_util_1.FilterUtil.buildSortFilter(sortBy, sortOrder))
            .skip(skip)
            .limit(validatedLimit)
            .lean();
        const total = await car_image_model_1.CarImage.countDocuments(filter);
        return { images, pagination: pagination_util_1.PaginationUtil.createPaginationMeta(page, validatedLimit, total) };
    }
    // ─── Car gallery grouped by category ────────────────────────────────────────
    static async getCarGallery(carId) {
        const images = await car_image_model_1.CarImage.find({
            car_id: carId,
            status: 'published',
            is_deleted: false,
        }).sort({ sort_order: 1 }).lean();
        const grouped = {};
        for (const img of images) {
            const cat = img.main_category || 'uncategorized';
            if (!grouped[cat])
                grouped[cat] = [];
            grouped[cat].push(img);
        }
        // Sort each category by priority
        for (const cat of Object.keys(grouped)) {
            grouped[cat] = media_priority_service_1.MediaPriorityService.sortByPriority(grouped[cat], cat);
        }
        return { images, grouped };
    }
    // ─── Create ─────────────────────────────────────────────────────────────────
    static async createCarImage(imageData, uploadedBy) {
        if (imageData.car_id) {
            const car = await car_model_1.Car.findOne({ car_id: imageData.car_id });
            if (!car)
                throw new app_error_util_1.AppError('Car not found', 404);
        }
        if (imageData.variant_id) {
            const variant = await car_variant_model_1.CarVariant.findOne({ variant_id: imageData.variant_id });
            if (!variant)
                throw new app_error_util_1.AppError('Variant not found', 404);
        }
        // Validate sub_category against main_category
        if (imageData.main_category && imageData.sub_category) {
            const allowed = media_constants_1.SUBCATEGORIES_BY_CATEGORY[imageData.main_category];
            if (allowed && !allowed.includes(imageData.sub_category)) {
                throw new app_error_util_1.AppError(`"${imageData.sub_category}" is not valid for category "${imageData.main_category}"`, 400);
            }
        }
        // Auto-generate SEO fields
        let seoFields = { alt_text: imageData.alt_text, image_title: imageData.image_title };
        if (imageData.car_id && imageData.sub_category) {
            const carName = await getCarName(imageData.car_id);
            if (carName) {
                seoFields = media_seo_service_1.MediaSeoService.buildSeoFields(carName, imageData.sub_category, imageData.alt_text, imageData.image_title);
            }
        }
        // Derive colour normalisation
        let normalized_color;
        let display_color_name;
        if (imageData.main_category === 'colours' && imageData.sub_category) {
            normalized_color = media_constants_1.COLOUR_HEX_MAP[imageData.sub_category];
            display_color_name = imageData.display_color_name || imageData.sub_category;
        }
        const status = inferStatus(imageData);
        const { is_published, is_deleted } = deriveStatusFlags(status);
        // Unset other primary images if this one is primary
        if (imageData.is_primary && imageData.car_id) {
            await car_image_model_1.CarImage.updateMany({ car_id: imageData.car_id, is_primary: true, is_deleted: false }, { is_primary: false });
        }
        const image = {
            image_uuid: imageData.image_uuid || (0, uuid_1.v4)(),
            car_id: imageData.car_id,
            variant_id: imageData.variant_id,
            main_category: imageData.main_category,
            sub_category: imageData.sub_category,
            media_scope: imageData.media_scope || 'standard',
            normalized_color,
            display_color_name,
            category_id: imageData.category_id,
            sub_category_id: imageData.sub_category_id,
            url: imageData.url,
            thumbnail_url: imageData.thumbnail_url,
            image_hash: imageData.image_hash,
            image_title: seoFields.image_title,
            alt_text: seoFields.alt_text,
            caption: imageData.caption,
            status,
            is_published,
            is_deleted,
            sort_order: imageData.sort_order ?? imageData.display_order ?? 0,
            display_order: imageData.display_order ?? 0,
            is_primary: imageData.is_primary || false,
            tags: imageData.tags,
            source: imageData.source,
            uploaded_by: uploadedBy,
            taken_at: imageData.taken_at,
            car_condition: imageData.car_condition,
            damage_area: imageData.damage_area,
            damage_note: imageData.damage_note,
            inspection_severity: imageData.inspection_severity,
            metadata: imageData.metadata,
        };
        return car_image_model_1.CarImage.create(image);
    }
    // ─── Update ─────────────────────────────────────────────────────────────────
    static async updateCarImage(imageId, imageData) {
        const existing = await car_image_model_1.CarImage.findById(imageId);
        if (!existing)
            throw new app_error_util_1.AppError('Car image not found', 404);
        const update = {};
        if (imageData.main_category !== undefined) {
            update.main_category = imageData.main_category;
            // Reset sub_category if category changes and new sub_category not provided
        }
        if (imageData.sub_category !== undefined) {
            const cat = (imageData.main_category || existing.main_category);
            if (cat) {
                const allowed = media_constants_1.SUBCATEGORIES_BY_CATEGORY[cat];
                if (allowed && !allowed.includes(imageData.sub_category)) {
                    throw new app_error_util_1.AppError(`"${imageData.sub_category}" is not valid for "${cat}"`, 400);
                }
            }
            update.sub_category = imageData.sub_category;
        }
        if (imageData.media_scope !== undefined)
            update.media_scope = imageData.media_scope;
        if (imageData.category_id !== undefined)
            update.category_id = imageData.category_id;
        if (imageData.sub_category_id !== undefined)
            update.sub_category_id = imageData.sub_category_id;
        if (imageData.url !== undefined)
            update.url = imageData.url;
        if (imageData.image_hash !== undefined)
            update.image_hash = imageData.image_hash;
        if (imageData.caption !== undefined)
            update.caption = imageData.caption;
        if (imageData.tags !== undefined)
            update.tags = imageData.tags;
        if (imageData.source !== undefined)
            update.source = imageData.source;
        if (imageData.display_order !== undefined)
            update.display_order = imageData.display_order;
        if (imageData.sort_order !== undefined)
            update.sort_order = imageData.sort_order;
        if (imageData.normalized_color !== undefined)
            update.normalized_color = imageData.normalized_color;
        if (imageData.display_color_name !== undefined)
            update.display_color_name = imageData.display_color_name;
        // Regenerate SEO if subcategory changed or explicit values provided
        const carId = imageData.car_id || existing.car_id;
        const subCat = update.sub_category || existing.sub_category;
        if (subCat && carId) {
            const carName = await getCarName(carId);
            if (carName) {
                const seo = media_seo_service_1.MediaSeoService.buildSeoFields(carName, subCat, imageData.alt_text, imageData.image_title);
                update.alt_text = seo.alt_text;
                update.image_title = seo.image_title;
            }
        }
        else {
            if (imageData.alt_text !== undefined)
                update.alt_text = imageData.alt_text;
            if (imageData.image_title !== undefined)
                update.image_title = imageData.image_title;
        }
        // Status workflow
        if (imageData.status !== undefined) {
            update.status = imageData.status;
            const flags = deriveStatusFlags(imageData.status);
            update.is_published = flags.is_published;
            update.is_deleted = flags.is_deleted;
        }
        else {
            if (imageData.is_published !== undefined)
                update.is_published = imageData.is_published;
        }
        // Primary handling
        if (imageData.is_primary !== undefined) {
            if (imageData.is_primary) {
                await car_image_model_1.CarImage.updateMany({ car_id: existing.car_id, is_primary: true, is_deleted: false, _id: { $ne: imageId } }, { is_primary: false });
            }
            update.is_primary = imageData.is_primary;
        }
        // Auto colour normalisation when category is colours
        const finalCategory = update.main_category || existing.main_category;
        const finalSub = update.sub_category || existing.sub_category;
        if (finalCategory === 'colours' && finalSub) {
            if (!update.normalized_color)
                update.normalized_color = media_constants_1.COLOUR_HEX_MAP[finalSub];
        }
        return car_image_model_1.CarImage.findByIdAndUpdate(imageId, update, { returnDocument: 'after' });
    }
    // ─── Bulk status update ──────────────────────────────────────────────────────
    static async bulkUpdateStatus(imageIds, status) {
        const { is_published, is_deleted } = deriveStatusFlags(status);
        const result = await car_image_model_1.CarImage.updateMany({ _id: { $in: imageIds } }, { status, is_published, is_deleted });
        return result;
    }
    // ─── Bulk category assign ────────────────────────────────────────────────────
    static async bulkAssignCategory(imageIds, mainCategory, subCategory) {
        if (subCategory) {
            const allowed = media_constants_1.SUBCATEGORIES_BY_CATEGORY[mainCategory];
            if (!allowed.includes(subCategory)) {
                throw new app_error_util_1.AppError(`"${subCategory}" is not valid for "${mainCategory}"`, 400);
            }
        }
        const update = { main_category: mainCategory };
        if (subCategory)
            update.sub_category = subCategory;
        return car_image_model_1.CarImage.updateMany({ _id: { $in: imageIds } }, update);
    }
    // ─── Bulk delete (soft) ──────────────────────────────────────────────────────
    static async bulkDelete(imageIds) {
        return car_image_model_1.CarImage.updateMany({ _id: { $in: imageIds } }, { is_deleted: true, status: 'rejected' });
    }
    static async deleteCarImage(imageId) {
        const image = await car_image_model_1.CarImage.findById(imageId);
        if (!image)
            throw new app_error_util_1.AppError('Car image not found', 404);
        try {
            const s3Key = extractS3Key(image.url);
            if (s3Key)
                await upload_service_1.UploadService.deleteFromS3(s3Key);
        }
        catch (err) {
            console.error('S3 delete error:', err);
        }
        await car_image_model_1.CarImage.findByIdAndUpdate(imageId, { is_deleted: true, status: 'rejected' });
        return image;
    }
    // ─── Restore ─────────────────────────────────────────────────────────────────
    static async restoreCarImage(imageId) {
        const image = await car_image_model_1.CarImage.findByIdAndUpdate(imageId, { is_deleted: false, status: 'draft' }, { returnDocument: 'after' });
        if (!image)
            throw new app_error_util_1.AppError('Car image not found', 404);
        return image;
    }
    // ─── Toggle publish ──────────────────────────────────────────────────────────
    static async togglePublish(imageId) {
        const image = await car_image_model_1.CarImage.findById(imageId);
        if (!image)
            throw new app_error_util_1.AppError('Car image not found', 404);
        const newStatus = image.status === 'published' ? 'draft' : 'published';
        const { is_published } = deriveStatusFlags(newStatus);
        image.status = newStatus;
        image.is_published = is_published;
        await image.save();
        return image;
    }
    // ─── Set primary ─────────────────────────────────────────────────────────────
    static async setPrimaryImage(imageId) {
        const image = await car_image_model_1.CarImage.findById(imageId);
        if (!image)
            throw new app_error_util_1.AppError('Car image not found', 404);
        if (!image.car_id)
            throw new app_error_util_1.AppError('Image must be associated with a car', 400);
        await car_image_model_1.CarImage.updateMany({ car_id: image.car_id, is_primary: true, is_deleted: false, _id: { $ne: imageId } }, { is_primary: false });
        image.is_primary = true;
        await image.save();
        return image;
    }
    // ─── Duplicate detection ────────────────────────────────────────────────────
    static async findDuplicateByHash(carId, imageHash) {
        return car_image_model_1.CarImage.findOne({ car_id: carId, image_hash: imageHash, is_deleted: false }).lean();
    }
    // ─── Resolve fallback image for a car ───────────────────────────────────────
    static async resolveFallbackImage(carId) {
        return media_fallback_service_1.MediaFallbackService.resolveImage(carId);
    }
}
exports.CarImageService = CarImageService;
