import { v2 as cloudinary } from 'cloudinary';
import { v4 as uuidv4 } from 'uuid';
import { CarImage, ICarImage } from '../../../models/car-image.model';
import { CarVariant } from '../../../models/car-variant.model';
import { Car } from '../../../models/car.model';
import {
  ImageStatus,
  MainCategory,
  MediaScope,
  SubCategory,
  COLOUR_HEX_MAP,
  SUBCATEGORIES_BY_CATEGORY,
} from '../../../shared/services/media/media-constants';
import { MediaSeoService } from '../../../shared/services/media/media-seo.service';
import { MediaPriorityService } from '../../../shared/services/media/media-priority.service';
import { MediaFallbackService } from '../../../shared/services/media/media-fallback.service';
import { AppError } from '../../../shared/utils/app-error.util';
import { FilterUtil } from '../../../shared/utils/filter.util';
import { PaginationUtil } from '../../../shared/utils/pagination.util';

// ─── Private helpers ──────────────────────────────────────────────────────────

function extractPublicId(url: string): string | null {
  if (!url) return null;
  const match = url.match(/\/v\d+\/(.+)\.\w+$/);
  return match ? match[1] : null;
}

async function getCarName(carId: string): Promise<string> {
  const car = await Car.findOne({ car_id: carId }).select('name brand').populate('brand', 'name').lean() as any;
  if (!car) return '';
  const brandName = car.brand?.name || '';
  return brandName ? `${brandName} ${car.name}` : car.name;
}

/** Synchronise is_published / is_deleted booleans with status field */
function deriveStatusFlags(status: ImageStatus): { is_published: boolean; is_deleted: boolean } {
  return {
    is_published: status === 'published',
    is_deleted: status === 'rejected',
  };
}

/** Map legacy is_published boolean to a status value on ingest */
function inferStatus(data: any): ImageStatus {
  if (data.status) return data.status as ImageStatus;
  if (data.is_deleted) return 'rejected';
  if (data.is_published) return 'published';
  return 'draft';
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class CarImageService {

  // ─── List ───────────────────────────────────────────────────────────────────

  static async getAllCarImages(filterDto: any, includeDeleted = false) {
    const {
      page = 1,
      limit = 20,
      car_id,
      variant_id,
      category_id,
      sub_category_id,
      main_category,
      sub_category,
      media_scope,
      status,
      is_published,
      is_primary,
      is_deleted,
      sortBy = 'sort_order',
      sortOrder = 'asc',
    } = filterDto;

    const filter: Record<string, unknown> = {};

    if (is_deleted === 'true' || is_deleted === true) {
      filter.is_deleted = true;
    } else if (!includeDeleted) {
      filter.is_deleted = false;
    }

    if (car_id) filter.car_id = car_id;
    if (variant_id) filter.variant_id = variant_id;
    if (category_id) filter.category_id = category_id;
    if (sub_category_id) filter.sub_category_id = sub_category_id;
    if (main_category) filter.main_category = main_category;
    if (sub_category) filter.sub_category = sub_category;
    if (media_scope) filter.media_scope = media_scope;
    if (status) filter.status = status;
    if (is_published !== undefined) filter.is_published = is_published;
    if (is_primary !== undefined) filter.is_primary = is_primary;

    const { skip, limit: validatedLimit } = PaginationUtil.getPaginationParams(page, limit);
    const sortFilter = FilterUtil.buildSortFilter(sortBy, sortOrder);

    const images = await CarImage.find(filter)
      .sort(sortFilter)
      .skip(skip)
      .limit(validatedLimit);

    const total = await CarImage.countDocuments(filter);
    return { images, pagination: PaginationUtil.createPaginationMeta(page, validatedLimit, total) };
  }

  // ─── Single ─────────────────────────────────────────────────────────────────

  static async getCarImageById(imageId: string) {
    return CarImage.findById(imageId);
  }

  // ─── Category-specific retrieval ────────────────────────────────────────────

  static async getImagesByCategory(carId: string, mainCategory: MainCategory, subCategory?: SubCategory) {
    const filter: Record<string, unknown> = {
      car_id: carId,
      main_category: mainCategory,
      status: 'published',
      is_deleted: false,
    };
    if (subCategory) filter.sub_category = subCategory;

    const images = await CarImage.find(filter)
      .sort({ sort_order: 1 })
      .lean();

    return MediaPriorityService.sortByPriority(images as any, mainCategory);
  }

  // ─── Primary image with fallback ────────────────────────────────────────────

  static async getPrimaryWithFallback(carId: string) {
    const primary = await CarImage.findOne({
      car_id: carId,
      is_primary: true,
      is_deleted: false,
    }).lean();

    if (primary) return { image: primary, level: 'primary' };

    const fallback = await MediaFallbackService.resolveImage(carId);
    return { image: null, fallback, level: fallback.level };
  }

  // ─── Public gallery ─────────────────────────────────────────────────────────

  static async getPublicGallery(filterDto: any) {
    const {
      page = 1,
      limit = 20,
      car_id,
      main_category,
      sortBy = 'sort_order',
      sortOrder = 'asc',
    } = filterDto;

    const filter: Record<string, unknown> = {
      status: 'published',
      is_deleted: false,
    };
    if (car_id) filter.car_id = car_id;
    if (main_category) filter.main_category = main_category;

    const { skip, limit: validatedLimit } = PaginationUtil.getPaginationParams(page, limit);
    const images = await CarImage.find(filter)
      .select('url alt_text image_title main_category sub_category sort_order is_primary')
      .sort(FilterUtil.buildSortFilter(sortBy, sortOrder))
      .skip(skip)
      .limit(validatedLimit)
      .lean();

    const total = await CarImage.countDocuments(filter);
    return { images, pagination: PaginationUtil.createPaginationMeta(page, validatedLimit, total) };
  }

  // ─── Car gallery grouped by category ────────────────────────────────────────

  static async getCarGallery(carId: string) {
    const images = await CarImage.find({
      car_id: carId,
      status: 'published',
      is_deleted: false,
    }).sort({ sort_order: 1 }).lean();

    const grouped: Record<string, any[]> = {};
    for (const img of images) {
      const cat = (img as any).main_category || 'uncategorized';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(img);
    }

    // Sort each category by priority
    for (const cat of Object.keys(grouped)) {
      grouped[cat] = MediaPriorityService.sortByPriority(grouped[cat], cat);
    }

    return { images, grouped };
  }

  // ─── Create ─────────────────────────────────────────────────────────────────

  static async createCarImage(imageData: any, uploadedBy?: string) {
    if (imageData.car_id) {
      const car = await Car.findOne({ car_id: imageData.car_id });
      if (!car) throw new AppError('Car not found', 404);
    }

    if (imageData.variant_id) {
      const variant = await CarVariant.findOne({ variant_id: imageData.variant_id });
      if (!variant) throw new AppError('Variant not found', 404);
    }

    // Validate sub_category against main_category
    if (imageData.main_category && imageData.sub_category) {
      const allowed = SUBCATEGORIES_BY_CATEGORY[imageData.main_category as MainCategory];
      if (allowed && !allowed.includes(imageData.sub_category)) {
        throw new AppError(
          `"${imageData.sub_category}" is not valid for category "${imageData.main_category}"`,
          400
        );
      }
    }

    // Auto-generate SEO fields
    let seoFields = { alt_text: imageData.alt_text, image_title: imageData.image_title };
    if (imageData.car_id && imageData.sub_category) {
      const carName = await getCarName(imageData.car_id);
      if (carName) {
        seoFields = MediaSeoService.buildSeoFields(
          carName,
          imageData.sub_category,
          imageData.alt_text,
          imageData.image_title,
        );
      }
    }

    // Derive colour normalisation
    let normalized_color: string | undefined;
    let display_color_name: string | undefined;
    if (imageData.main_category === 'colours' && imageData.sub_category) {
      normalized_color = COLOUR_HEX_MAP[imageData.sub_category];
      display_color_name = imageData.display_color_name || imageData.sub_category;
    }

    const status: ImageStatus = inferStatus(imageData);
    const { is_published, is_deleted } = deriveStatusFlags(status);

    // Unset other primary images if this one is primary
    if (imageData.is_primary && imageData.car_id) {
      await CarImage.updateMany(
        { car_id: imageData.car_id, is_primary: true, is_deleted: false },
        { is_primary: false }
      );
    }

    const image: Partial<ICarImage> = {
      image_uuid: imageData.image_uuid || uuidv4(),
      car_id: imageData.car_id,
      variant_id: imageData.variant_id,

      main_category: imageData.main_category,
      sub_category: imageData.sub_category,
      media_scope: (imageData.media_scope as MediaScope) || 'standard',
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

    return CarImage.create(image);
  }

  // ─── Update ─────────────────────────────────────────────────────────────────

  static async updateCarImage(imageId: string, imageData: any) {
    const existing = await CarImage.findById(imageId);
    if (!existing) throw new AppError('Car image not found', 404);

    const update: Partial<ICarImage> = {};

    if (imageData.main_category !== undefined) {
      update.main_category = imageData.main_category;
      // Reset sub_category if category changes and new sub_category not provided
    }
    if (imageData.sub_category !== undefined) {
      const cat = (imageData.main_category || existing.main_category) as MainCategory;
      if (cat) {
        const allowed = SUBCATEGORIES_BY_CATEGORY[cat];
        if (allowed && !allowed.includes(imageData.sub_category)) {
          throw new AppError(`"${imageData.sub_category}" is not valid for "${cat}"`, 400);
        }
      }
      update.sub_category = imageData.sub_category;
    }

    if (imageData.media_scope !== undefined) update.media_scope = imageData.media_scope;
    if (imageData.category_id !== undefined) update.category_id = imageData.category_id;
    if (imageData.sub_category_id !== undefined) update.sub_category_id = imageData.sub_category_id;
    if (imageData.url !== undefined) update.url = imageData.url;
    if (imageData.image_hash !== undefined) update.image_hash = imageData.image_hash;
    if (imageData.caption !== undefined) update.caption = imageData.caption;
    if (imageData.tags !== undefined) update.tags = imageData.tags;
    if (imageData.source !== undefined) update.source = imageData.source;
    if (imageData.display_order !== undefined) update.display_order = imageData.display_order;
    if (imageData.sort_order !== undefined) update.sort_order = imageData.sort_order;
    if (imageData.normalized_color !== undefined) update.normalized_color = imageData.normalized_color;
    if (imageData.display_color_name !== undefined) update.display_color_name = imageData.display_color_name;

    // Regenerate SEO if subcategory changed or explicit values provided
    const carId = imageData.car_id || existing.car_id;
    const subCat = update.sub_category || existing.sub_category;
    if (subCat && carId) {
      const carName = await getCarName(carId);
      if (carName) {
        const seo = MediaSeoService.buildSeoFields(
          carName,
          subCat,
          imageData.alt_text,
          imageData.image_title,
        );
        update.alt_text = seo.alt_text;
        update.image_title = seo.image_title;
      }
    } else {
      if (imageData.alt_text !== undefined) update.alt_text = imageData.alt_text;
      if (imageData.image_title !== undefined) update.image_title = imageData.image_title;
    }

    // Status workflow
    if (imageData.status !== undefined) {
      update.status = imageData.status;
      const flags = deriveStatusFlags(imageData.status);
      update.is_published = flags.is_published;
      update.is_deleted = flags.is_deleted;
    } else {
      if (imageData.is_published !== undefined) update.is_published = imageData.is_published;
    }

    // Primary handling
    if (imageData.is_primary !== undefined) {
      if (imageData.is_primary) {
        await CarImage.updateMany(
          { car_id: existing.car_id, is_primary: true, is_deleted: false, _id: { $ne: imageId } },
          { is_primary: false }
        );
      }
      update.is_primary = imageData.is_primary;
    }

    // Auto colour normalisation when category is colours
    const finalCategory = update.main_category || existing.main_category;
    const finalSub = update.sub_category || existing.sub_category;
    if (finalCategory === 'colours' && finalSub) {
      if (!update.normalized_color) update.normalized_color = COLOUR_HEX_MAP[finalSub];
    }

    return CarImage.findByIdAndUpdate(imageId, update, { returnDocument: 'after' });
  }

  // ─── Bulk status update ──────────────────────────────────────────────────────

  static async bulkUpdateStatus(imageIds: string[], status: ImageStatus) {
    const { is_published, is_deleted } = deriveStatusFlags(status);
    const result = await CarImage.updateMany(
      { _id: { $in: imageIds } },
      { status, is_published, is_deleted }
    );
    return result;
  }

  // ─── Bulk category assign ────────────────────────────────────────────────────

  static async bulkAssignCategory(
    imageIds: string[],
    mainCategory: MainCategory,
    subCategory?: SubCategory,
  ) {
    if (subCategory) {
      const allowed = SUBCATEGORIES_BY_CATEGORY[mainCategory];
      if (!allowed.includes(subCategory)) {
        throw new AppError(`"${subCategory}" is not valid for "${mainCategory}"`, 400);
      }
    }

    const update: Record<string, any> = { main_category: mainCategory };
    if (subCategory) update.sub_category = subCategory;

    return CarImage.updateMany({ _id: { $in: imageIds } }, update);
  }

  // ─── Bulk delete (soft) ──────────────────────────────────────────────────────

  static async bulkDelete(imageIds: string[]) {
    return CarImage.updateMany(
      { _id: { $in: imageIds } },
      { is_deleted: true, status: 'rejected' }
    );
  }

  // ─── Delete (soft) ───────────────────────────────────────────────────────────

  static async deleteCarImage(imageId: string) {
    const image = await CarImage.findById(imageId);
    if (!image) throw new AppError('Car image not found', 404);

    try {
      const publicId = extractPublicId(image.url);
      if (publicId) await cloudinary.uploader.destroy(publicId);
    } catch (err) {
      console.error('Cloudinary delete error:', err);
    }

    await CarImage.findByIdAndUpdate(imageId, { is_deleted: true, status: 'rejected' });
    return image;
  }

  // ─── Restore ─────────────────────────────────────────────────────────────────

  static async restoreCarImage(imageId: string) {
    const image = await CarImage.findByIdAndUpdate(
      imageId,
      { is_deleted: false, status: 'draft' },
      { returnDocument: 'after' }
    );
    if (!image) throw new AppError('Car image not found', 404);
    return image;
  }

  // ─── Toggle publish ──────────────────────────────────────────────────────────

  static async togglePublish(imageId: string) {
    const image = await CarImage.findById(imageId);
    if (!image) throw new AppError('Car image not found', 404);

    const newStatus: ImageStatus = image.status === 'published' ? 'draft' : 'published';
    const { is_published } = deriveStatusFlags(newStatus);

    image.status = newStatus;
    image.is_published = is_published;
    await image.save();

    return image;
  }

  // ─── Set primary ─────────────────────────────────────────────────────────────

  static async setPrimaryImage(imageId: string) {
    const image = await CarImage.findById(imageId);
    if (!image) throw new AppError('Car image not found', 404);
    if (!image.car_id) throw new AppError('Image must be associated with a car', 400);

    await CarImage.updateMany(
      { car_id: image.car_id, is_primary: true, is_deleted: false, _id: { $ne: imageId } },
      { is_primary: false }
    );

    image.is_primary = true;
    await image.save();

    return image;
  }

  // ─── Duplicate detection ────────────────────────────────────────────────────

  static async findDuplicateByHash(carId: string, imageHash: string) {
    return CarImage.findOne({ car_id: carId, image_hash: imageHash, is_deleted: false }).lean();
  }

  // ─── Resolve fallback image for a car ───────────────────────────────────────

  static async resolveFallbackImage(carId: string) {
    return MediaFallbackService.resolveImage(carId);
  }
}
