import { v2 as cloudinary } from 'cloudinary';
import { v4 as uuidv4 } from 'uuid';
import { CarImage, ICarImage } from "../../../models/car-image.model";
import { CarVariant } from "../../../models/car-variant.model";
import { Car } from "../../../models/car.model";
import { ImageCategory } from "../../../models/image-category.model";
import { ImageSubCategory } from "../../../models/image-subcategory.model";
import { AppError } from "../../../shared/utils/app-error.util";
import { FilterUtil } from "../../../shared/utils/filter.util";
import { PaginationUtil } from "../../../shared/utils/pagination.util";

export class CarImageService {
  static async getAllCarImages(filterDto: any, includeDeleted: boolean = false) {
    const {
      page = 1,
      limit = 10,
      car_id,
      variant_id,
      category_id,
      sub_category_id,
      is_published,
      is_primary,
      sortBy = 'display_order',
      sortOrder = 'asc',
    } = filterDto;

    const filter: Record<string, unknown> = {};

    if (!includeDeleted) {
      filter.is_deleted = false;
    }

    if (car_id) filter.car_id = car_id;
    if (variant_id) filter.variant_id = variant_id;
    if (category_id) filter.category_id = category_id;
    if (sub_category_id) filter.sub_category_id = sub_category_id;
    if (is_published !== undefined) filter.is_published = is_published;
    if (is_primary !== undefined) filter.is_primary = is_primary;

    const { skip, limit: validatedLimit } = PaginationUtil.getPaginationParams(page, limit);
    const sortFilter = FilterUtil.buildSortFilter(sortBy, sortOrder);

    const images = await CarImage.find(filter)
      .populate('car_id', 'name slug')
      .populate('variant_id', 'name slug')
      .populate('category_id', 'name slug')
      .populate('sub_category_id', 'name slug')
      .sort(sortFilter)
      .skip(skip)
      .limit(validatedLimit);

    const total = await CarImage.countDocuments(filter);
    const paginationMeta = PaginationUtil.createPaginationMeta(page, validatedLimit, total);

    return { images, pagination: paginationMeta };
  }

  static async getCarImageById(imageId: string) {
    return await CarImage.findById(imageId)
      .populate('car_id', 'name slug')
      .populate('variant_id', 'name slug')
      .populate('category_id', 'name slug')
      .populate('sub_category_id', 'name slug');
  }

  static async getPublicGallery(filterDto: any) {
    const {
      page = 1,
      limit = 20,
      car_id,
      category_id,
      sortBy = 'display_order',
      sortOrder = 'asc',
    } = filterDto;

    const filter: Record<string, unknown> = {
      is_published: true,
      is_deleted: false,
    };

    if (car_id) filter.car_id = car_id;
    if (category_id) filter.category_id = category_id;

    const { skip, limit: validatedLimit } = PaginationUtil.getPaginationParams(page, limit);
    const sortFilter = FilterUtil.buildSortFilter(sortBy, sortOrder);

    const images = await CarImage.find(filter)
      .populate('car_id', 'name slug')
      .populate('category_id', 'name slug')
      .select('url thumbnail_url alt_text caption display_order')
      .sort(sortFilter)
      .skip(skip)
      .limit(validatedLimit)
      .lean();

    const total = await CarImage.countDocuments(filter);
    const paginationMeta = PaginationUtil.createPaginationMeta(page, validatedLimit, total);

    return { images, pagination: paginationMeta };
  }

  static async getCarGallery(carId: string) {
    const images = await CarImage.find({
      car_id: carId as any,
      is_published: true,
      is_deleted: false,
    })
      .populate('category_id', 'name slug')
      .populate('sub_category_id', 'name slug')
      .sort({ display_order: 1 });

    // Group by category
    const grouped = images.reduce((acc: Record<string, any>, img: any) => {
      const category = img.category_id?.name || 'Uncategorized';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(img);
      return acc;
    }, {});

    return { images, grouped };
  }

  static async createCarImage(imageData: any, uploadedBy?: string) {
    // Validate foreign keys
    if (imageData.car_id) {
      const car = await Car.findById(imageData.car_id);
      if (!car) {
        throw new AppError('Car not found', 404);
      }
    }

    if (imageData.variant_id) {
      const variant = await CarVariant.findById(imageData.variant_id);
      if (!variant) {
        throw new AppError('Variant not found', 404);
      }
    }

    if (imageData.category_id) {
      const category = await ImageCategory.findById(imageData.category_id);
      if (!category) {
        throw new AppError('Image category not found', 404);
      }
    }

    if (imageData.sub_category_id) {
      const subcategory = await ImageSubCategory.findById(imageData.sub_category_id);
      if (!subcategory) {
        throw new AppError('Image subcategory not found', 404);
      }
    }

    // If setting as primary, unset other primary images for this car
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

    return await CarImage.create(image);
  }

  static async updateCarImage(imageId: string, imageData: any) {
    const updateData: Partial<ICarImage> = {};

    if (imageData.car_id !== undefined) {
      const car = await Car.findById(imageData.car_id);
      if (!car) {
        throw new AppError('Car not found', 404);
      }
      updateData.car_id = imageData.car_id;
    }

    if (imageData.variant_id !== undefined) {
      const variant = await CarVariant.findById(imageData.variant_id);
      if (!variant) {
        throw new AppError('Variant not found', 404);
      }
      updateData.variant_id = imageData.variant_id;
    }

    if (imageData.category_id !== undefined) {
      const category = await ImageCategory.findById(imageData.category_id);
      if (!category) {
        throw new AppError('Image category not found', 404);
      }
      updateData.category_id = imageData.category_id;
    }

    if (imageData.sub_category_id !== undefined) {
      const subcategory = await ImageSubCategory.findById(imageData.sub_category_id);
      if (!subcategory) {
        throw new AppError('Image subcategory not found', 404);
      }
      updateData.sub_category_id = imageData.sub_category_id;
    }

    if (imageData.url !== undefined) updateData.url = imageData.url;
    if (imageData.thumbnail_url !== undefined) updateData.thumbnail_url = imageData.thumbnail_url;
    if (imageData.alt_text !== undefined) updateData.alt_text = imageData.alt_text;
    if (imageData.caption !== undefined) updateData.caption = imageData.caption;
    if (imageData.tags !== undefined) updateData.tags = imageData.tags;
    if (imageData.display_order !== undefined) updateData.display_order = imageData.display_order;
    if (imageData.is_published !== undefined) updateData.is_published = imageData.is_published;
    if (imageData.is_primary !== undefined) {
      // If setting as primary, unset other primary images for this car
      const existingImage = await CarImage.findById(imageId);
      if (existingImage && existingImage.car_id && imageData.is_primary) {
        await CarImage.updateMany(
          { car_id: existingImage.car_id, is_primary: true, is_deleted: false, _id: { $ne: imageId } },
          { is_primary: false }
        );
      }
      updateData.is_primary = imageData.is_primary;
    }
    if (imageData.source !== undefined) updateData.source = imageData.source;
    if (imageData.car_condition !== undefined) updateData.car_condition = imageData.car_condition;
    if (imageData.taken_at !== undefined) updateData.taken_at = imageData.taken_at;
    if (imageData.damage_area !== undefined) updateData.damage_area = imageData.damage_area;
    if (imageData.damage_note !== undefined) updateData.damage_note = imageData.damage_note;
    if (imageData.inspection_severity !== undefined) updateData.inspection_severity = imageData.inspection_severity;
    if (imageData.metadata !== undefined) updateData.metadata = imageData.metadata;

    const image = await CarImage.findByIdAndUpdate(
      imageId,
      updateData,
      { returnDocument: 'after' }
    );

    if (!image) {
      throw new AppError('Car image not found', 404);
    }

    return image;
  }

  static async deleteCarImage(imageId: string) {
    const image = await CarImage.findById(imageId);

    if (!image) {
      throw new AppError('Car image not found', 404);
    }

    // Delete from Cloudinary
    try {
      const publicId = this.extractPublicId(image.url);
      if (publicId) {
        await cloudinary.uploader.destroy(publicId);
      }

      if (image.thumbnail_url) {
        const thumbnailPublicId = this.extractPublicId(image.thumbnail_url);
        if (thumbnailPublicId) {
          await cloudinary.uploader.destroy(thumbnailPublicId);
        }
      }
    } catch (error) {
      console.error('Error deleting from Cloudinary:', error);
      // Continue with DB deletion even if Cloudinary fails
    }

    // Soft delete from DB
    await CarImage.findByIdAndUpdate(imageId, { is_deleted: true });

    return image;
  }

  static async restoreCarImage(imageId: string) {
    const image = await CarImage.findByIdAndUpdate(
      imageId,
      { is_deleted: false },
      { returnDocument: 'after' }
    );

    if (!image) {
      throw new AppError('Car image not found', 404);
    }

    return image;
  }

  static async togglePublish(imageId: string) {
    const image = await CarImage.findById(imageId);

    if (!image) {
      throw new AppError('Car image not found', 404);
    }

    image.is_published = !image.is_published;
    await image.save();

    return image;
  }

  static async setPrimaryImage(imageId: string) {
    const image = await CarImage.findById(imageId);

    if (!image) {
      throw new AppError('Car image not found', 404);
    }

    if (!image.car_id) {
      throw new AppError('Image must be associated with a car to be set as primary', 400);
    }

    // Unset other primary images for this car
    await CarImage.updateMany(
      { car_id: image.car_id, is_primary: true, is_deleted: false, _id: { $ne: imageId } },
      { is_primary: false }
    );

    // Set this image as primary
    image.is_primary = true;
    await image.save();

    return image;
  }

  private static extractPublicId(url: string): string | null {
    if (!url) return null;
    
    // Cloudinary URL format: https://res.cloudinary.com/cloud_name/image/upload/v1234567890/folder/public_id.ext
    const match = url.match(/\/v\d+\/(.+)\.\w+$/);
    return match ? match[1] : null;
  }
}
