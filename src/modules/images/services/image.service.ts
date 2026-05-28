import { IImage, Image } from "../../../models/image.model";
import { UploadService } from "../../../shared/services/upload.service";
import { AppError } from "../../../shared/utils/app-error.util";
import { FilterUtil } from "../../../shared/utils/filter.util";
import { PaginationUtil } from "../../../shared/utils/pagination.util";
import { logger } from '../../../utils/logger';

export class ImageService {
  static async getAllImages(filterDto: any, includeDeleted: boolean = false) {
    const {
      page = 1,
      limit = 20,
      folder,
      mime_type,
      tags,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filterDto;

    const filter: Record<string, unknown> = {};

    if (!includeDeleted) {
      filter.is_deleted = false;
    }

    if (folder) filter.folder = folder;
    if (mime_type) filter.mime_type = mime_type;
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : tags.split(',');
      filter.tags = { $in: tagArray };
    }

    const { skip, limit: validatedLimit } = PaginationUtil.getPaginationParams(page, limit);
    const sortFilter = FilterUtil.buildSortFilter(sortBy, sortOrder);

    const images = await Image.find(filter)
      .sort(sortFilter)
      .skip(skip)
      .limit(validatedLimit);

    const total = await Image.countDocuments(filter);
    const paginationMeta = PaginationUtil.createPaginationMeta(page, validatedLimit, total);

    return { images, pagination: paginationMeta };
  }

  static async getImageById(imageId: string) {
    const image = await Image.findById(imageId);

    if (!image) {
      throw new AppError('Image not found', 404);
    }

    return image;
  }

  static async createImage(imageData: any, uploadedBy?: string) {
    const image: Partial<IImage> = {
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

    return await Image.create(image);
  }

  static async deleteImage(imageId: string) {
    const image = await Image.findById(imageId);

    if (!image) {
      throw new AppError('Image not found', 404);
    }

    // Delete from Cloudinary if public_id exists
    if (image.public_id) {
      try {
        await UploadService.deleteFromCloudinary(image.public_id);
      } catch (error) {
        logger.error('Error deleting from Cloudinary:', error);
        // Continue with DB deletion even if Cloudinary fails
      }
    }

    // Soft delete from DB
    await Image.findByIdAndUpdate(imageId, { is_deleted: true });

    return image;
  }

  static async restoreImage(imageId: string) {
    const image = await Image.findByIdAndUpdate(
      imageId,
      { is_deleted: false },
      { returnDocument: 'after' }
    );

    if (!image) {
      throw new AppError('Image not found', 404);
    }

    return image;
  }

  static async hardDeleteImage(imageId: string) {
    const image = await Image.findById(imageId);

    if (!image) {
      throw new AppError('Image not found', 404);
    }

    // Delete from Cloudinary if public_id exists
    if (image.public_id) {
      try {
        await UploadService.deleteFromCloudinary(image.public_id);
      } catch (error) {
        logger.error('Error deleting from Cloudinary:', error);
      }
    }

    // Hard delete from DB
    await Image.findByIdAndDelete(imageId);

    return image;
  }

  static async updateImage(imageId: string, imageData: any) {
    const updateData: Partial<IImage> = {};

    if (imageData.alt_text !== undefined) updateData.alt_text = imageData.alt_text;
    if (imageData.caption !== undefined) updateData.caption = imageData.caption;
    if (imageData.tags !== undefined) updateData.tags = imageData.tags;
    if (imageData.metadata !== undefined) updateData.metadata = imageData.metadata;

    const image = await Image.findByIdAndUpdate(
      imageId,
      updateData,
      { returnDocument: 'after' }
    );

    if (!image) {
      throw new AppError('Image not found', 404);
    }

    return image;
  }

  static async createImageWithCleanup(
    uploadedFile: any,
    additionalData?: any,
    uploadedBy?: string
  ) {
    let savedImage: IImage | null = null;

    try {
      // Save to database
      savedImage = await this.createImage(
        {
          ...uploadedFile,
          ...additionalData,
        },
        uploadedBy
      );

      return savedImage;
    } catch (error) {
      // Cleanup: Delete from Cloudinary if DB save fails
      if (uploadedFile.publicId) {
        try {
          await UploadService.deleteFromCloudinary(uploadedFile.publicId);
        } catch (cleanupError) {
          logger.error('Error during cleanup after DB save failure:', cleanupError);
        }
      }

      // Re-throw the original error
      throw error;
    }
  }

  static async createMultipleImagesWithCleanup(
    uploadedFiles: any[],
    additionalData?: any,
    uploadedBy?: string
  ) {
    const savedImages: IImage[] = [];
    const failedFiles: any[] = [];

    // Batch create all images in parallel instead of sequential
    const createPromises = uploadedFiles.map(file =>
      this.createImage(
        {
          ...file,
          ...additionalData,
        },
        uploadedBy
      ).then(savedImage => ({
        success: true,
        file,
        savedImage,
      })).catch(error => ({
        success: false,
        file,
        error,
      }))
    );

    const results = await Promise.all(createPromises);

    // Process results - separate successful from failed
    for (const result of results) {
      if (result.success && 'savedImage' in result) {
        savedImages.push((result as any).savedImage);
      } else {
        // Cleanup failed file from Cloudinary
        if (result.file.publicId) {
          try {
            await UploadService.deleteFromCloudinary(result.file.publicId);
          } catch (cleanupError) {
            logger.error('Error during cleanup after DB save failure:', cleanupError);
          }
        }
        failedFiles.push(result);
      }
    }

    // If any files failed, rollback all successfully saved images in parallel
    if (failedFiles.length > 0 && savedImages.length > 0) {
      // Parallelize Cloudinary deletions
      await Promise.all(
        savedImages
          .filter(image => image.public_id)
          .map(image =>
            UploadService.deleteFromCloudinary(image.public_id!).catch(cleanupError => {
              logger.error('Error during rollback cleanup:', cleanupError);
            })
          )
      );

      // Batch delete images from DB instead of sequential deletes
      const imageIds = savedImages.map(image => image._id);
      if (imageIds.length > 0) {
        await Image.deleteMany({ _id: { $in: imageIds } });
      }

      throw new AppError(
        `Failed to save ${failedFiles.length} image(s). All uploads have been rolled back.`,
        500
      );
    }

    return savedImages;
  }
}
