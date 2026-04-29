import { Response } from 'express';
import { UploadService } from '../../../shared/services/upload.service';
import { ResponseUtil } from '../../../shared/utils/response.util';
import { catchAsync } from '../../../utils/catchAsync';
import { ImageService } from '../services/image.service';

export class ImageController {
  static uploadImage = catchAsync(async (req: any, res: Response) => {
    if (!req.file) {
      return ResponseUtil.error(res, 'No file uploaded', 400);
    }

    const uploadedFile = UploadService.formatUploadedFile(req.file);

    const image = {
      url: uploadedFile.url,
      publicId: uploadedFile.publicId,
      originalName: uploadedFile.originalName,
      mimeType: uploadedFile.mimeType,
      size: uploadedFile.size,
    };

    return ResponseUtil.success(res, image, 'Image uploaded successfully');
  });

  static uploadImageWithSave = catchAsync(async (req: any, res: Response) => {
    if (!req.file) {
      return ResponseUtil.error(res, 'No file uploaded', 400);
    }

    const uploadedFile = UploadService.formatUploadedFile(req.file);
    const uploadedBy = (req as any).user?.user_id || (req as any).user?.id;

    const image = await ImageService.createImageWithCleanup(
      uploadedFile,
      {
        alt_text: req.body.alt_text,
        caption: req.body.caption,
        tags: req.body.tags ? (Array.isArray(req.body.tags) ? req.body.tags : req.body.tags.split(',')) : undefined,
        folder: req.body.folder,
      },
      uploadedBy
    );

    return ResponseUtil.created(res, image, 'Image uploaded and saved successfully');
  });

  static uploadMultipleImages = catchAsync(async (req: any, res: Response) => {
    if (!req.files || req.files.length === 0) {
      return ResponseUtil.error(res, 'No files uploaded', 400);
    }

    const images = req.files.map((file: any) => {
      const uploadedFile = UploadService.formatUploadedFile(file);
      return {
        url: uploadedFile.url,
        publicId: uploadedFile.publicId,
        originalName: uploadedFile.originalName,
        mimeType: uploadedFile.mimeType,
        size: uploadedFile.size,
      };
    });

    return ResponseUtil.success(res, { images }, `${images.length} images uploaded successfully`);
  });

  static uploadMultipleImagesWithSave = catchAsync(async (req: any, res: Response) => {
    if (!req.files || req.files.length === 0) {
      return ResponseUtil.error(res, 'No files uploaded', 400);
    }

    const uploadedFiles = req.files.map((file: any) => UploadService.formatUploadedFile(file));
    const uploadedBy = (req as any).user?.user_id || (req as any).user?.id;

    const images = await ImageService.createMultipleImagesWithCleanup(
      uploadedFiles,
      {
        alt_text: req.body.alt_text,
        caption: req.body.caption,
        tags: req.body.tags ? (Array.isArray(req.body.tags) ? req.body.tags : req.body.tags.split(',')) : undefined,
        folder: req.body.folder,
      },
      uploadedBy
    );

    return ResponseUtil.created(res, { images }, `${images.length} images uploaded and saved successfully`);
  });

  static listImages = catchAsync(async (req: any, res: Response) => {
    const result = await ImageService.getAllImages(req.query, false);
    return ResponseUtil.paginated(res, result.images, result.pagination, 'Images retrieved successfully');
  });

  static getImage = catchAsync(async (req: any, res: Response) => {
    const image = await ImageService.getImageById(req.params.id);
    return ResponseUtil.success(res, image, 'Image retrieved successfully');
  });

  static deleteImage = catchAsync(async (req: any, res: Response) => {
    const image = await ImageService.deleteImage(req.params.id);
    return ResponseUtil.success(res, image, 'Image deleted successfully');
  });

  static updateImage = catchAsync(async (req: any, res: Response) => {
    const image = await ImageService.updateImage(req.params.id, req.body);
    return ResponseUtil.success(res, image, 'Image updated successfully');
  });
}
