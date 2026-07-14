import { v4 as uuidv4 } from 'uuid';
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
    // Set image_id explicitly; relying on the schema default has been flaky in
    // prod (sporadic "Path `image_id` is required" 400s on /images/upload/save).
    const image: Partial<IImage> = {
      image_id: imageData.image_id || uuidv4(),
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

    // Delete from S3 if public_id exists
    if (image.public_id) {
      try {
        await UploadService.deleteFromS3(image.public_id);
      } catch (error) {
        logger.error('Error deleting from S3:', error);
        // Continue with DB deletion even if S3 fails
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

    // Delete from S3 if public_id exists
    if (image.public_id) {
      try {
        await UploadService.deleteFromS3(image.public_id);
      } catch (error) {
        logger.error('Error deleting from S3:', error);
      }
    }

    // Hard delete from DB
    await Image.deleteOne({ image_id: imageId });

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
      // Cleanup: Delete from S3 if DB save fails
      if (uploadedFile.publicId) {
        try {
          await UploadService.deleteFromS3(uploadedFile.publicId);
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
        // Cleanup failed file from S3
        if (result.file.publicId) {
          try {
            await UploadService.deleteFromS3(result.file.publicId);
          } catch (cleanupError) {
            logger.error('Error during cleanup after DB save failure:', cleanupError);
          }
        }
        failedFiles.push(result);
      }
    }

    // If any files failed, rollback all successfully saved images in parallel
    if (failedFiles.length > 0 && savedImages.length > 0) {
      // Parallelize S3 deletions
      await Promise.all(
        savedImages
          .filter(image => image.public_id)
          .map(image =>
            UploadService.deleteFromS3(image.public_id!).catch(cleanupError => {
              logger.error('Error during rollback cleanup:', cleanupError);
            })
          )
      );

      // Batch delete images from DB instead of sequential deletes
      const imageIds = savedImages.map(image => image.image_id);
      if (imageIds.length > 0) {
        await Image.deleteMany({ image_id: { $in: imageIds } });
      }

      throw new AppError(
        `Failed to save ${failedFiles.length} image(s). All uploads have been rolled back.`,
        500
      );
    }

    return savedImages;
  }
}
