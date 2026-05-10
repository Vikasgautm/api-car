import { Request, Response } from "express";
import { ERROR_CODES, USER_MESSAGES } from "../../../constants/errorMessages";
import { UploadService } from "../../../shared/services/upload.service";
import { AppError } from '../../../shared/utils/app-error.util';
import { ResponseUtil } from "../../../shared/utils/response.util";
import { catchAsync } from "../../../utils/catchAsync";
import { CreateBlogDto } from "../dto/create-blog.dto";
import { UpdateBlogDto } from "../dto/update-blog.dto";
import { BlogService } from "../services/blog.service";

interface MulterRequest extends Request {
  file?: Express.Multer.File;
  files?: {
    [fieldname: string]: Express.Multer.File[];
  } | Express.Multer.File[];
}

// Type guard to check if files is an object with field names
function isFilesObject(files: any): files is { [fieldname: string]: Express.Multer.File[] } {
  return files && typeof files === 'object' && !Array.isArray(files);
}

// Helper to get file URL from either Cloudinary (secure_url) or local storage (path)
function getFileUrl(file: Express.Multer.File): string {
  const cloudinaryFile = file as Express.Multer.File & { secure_url?: string };
  return cloudinaryFile.secure_url || file.path;
}

export class BlogController {
  // Public routes
  static getAllPublicBlogs = catchAsync(async (req: Request, res: Response) => {
    const filterDto = {
      ...req.query,
      is_published: true,
    };
    const result = await BlogService.getAllBlogs(filterDto, false);
    return ResponseUtil.paginated(res, result.blogs, result.pagination, 'Blogs retrieved successfully');
  });

  static getPublicBlogBySlug = catchAsync(async (req: Request, res: Response) => {
    const blog = await BlogService.getBlogBySlug(req.params.slug as string);
    if (!blog) {
      throw new AppError(
        `Blog not found for slug: ${req.params.slug}`,
        404,
        {
          userMessage: USER_MESSAGES.BLOG_NOT_FOUND,
          errorCode: ERROR_CODES.BLOG_NOT_FOUND,
          details: {
            field: 'slug',
            reason: 'The blog does not exist or has been deleted.',
          },
        }
      );
    }
    return ResponseUtil.success(res, blog, "Blog retrieved successfully");
  });

  // Admin routes
  static getAllAdminBlogs = catchAsync(async (req: Request, res: Response) => {
    const result = await BlogService.getAllBlogs(req.query, true);
    return ResponseUtil.paginated(res, result.blogs, result.pagination, 'Blogs retrieved successfully');
  });

  static getAdminBlogById = catchAsync(async (req: Request, res: Response) => {
    const blog = await BlogService.getBlogById(req.params.id as string);
    if (!blog) {
      throw new AppError(
        `Blog not found for blog_id: ${req.params.id}`,
        404,
        {
          userMessage: USER_MESSAGES.BLOG_NOT_FOUND,
          errorCode: ERROR_CODES.BLOG_NOT_FOUND,
          details: {
            field: 'blog_id',
            reason: 'The blog does not exist or has been deleted.',
          },
        }
      );
    }
    return ResponseUtil.success(res, blog, "Blog retrieved successfully");
  });

  static createBlog = catchAsync(async (req: MulterRequest, res: Response) => {
    let thumbnailUrl = req.body.thumbnail_url;
    let linkUrl = req.body.link;
    let images: Array<{ url: string; alt?: string }> = [];

    if (isFilesObject(req.files) && req.files["thumbnail"]) {
      thumbnailUrl = getFileUrl(req.files["thumbnail"][0]);
    }

    if (isFilesObject(req.files) && req.files["linkImage"]) {
      linkUrl = getFileUrl(req.files["linkImage"][0]);
    }

    if (isFilesObject(req.files) && req.files["images"]) {
      images = req.files.images.map((file: any) => ({ url: getFileUrl(file) }));
    }

    if (req.body.images) {
      try {
        const parsedImages = JSON.parse(req.body.images);
        images = [...images, ...parsedImages];
      } catch {
        // ignore parse errors
      }
    }

    const createDto: CreateBlogDto = {
      title: req.body.title,
      content: req.body.content,
      excerpt: req.body.excerpt,
      // author_name: req.body.author_name,
      // author_id: req.body.author_id,
      category: req.body.category,
      tags: req.body.tags ? (Array.isArray(req.body.tags) ? req.body.tags : req.body.tags.split(',')) : undefined,
      thumbnail_url: thumbnailUrl,
      thumbnail_alt: req.body.thumbnail_alt,
      images,
      link: linkUrl,
      is_published: req.body.is_published,
      is_featured: req.body.is_featured,
      meta_title: req.body.meta_title,
      meta_description: req.body.meta_description,
      meta_keywords: req.body.meta_keywords,
      og_image: req.body.og_image,
      canonical_url: req.body.canonical_url,
      noindex: req.body.noindex,
    };
    console.log(createDto, "hello");
    
    const validation = CreateBlogDto.validate(createDto);
    if (!validation.valid) {
      throw new AppError(
        validation.errors.join(', '),
        400,
        {
          userMessage: USER_MESSAGES.VALIDATION_ERROR,
          errorCode: ERROR_CODES.VALIDATION_ERROR,
          details: {
            fields: validation.errors,
          },
        }
      );
    }

    const blog = await BlogService.createBlog(createDto);
    return ResponseUtil.created(res, blog, "Blog created successfully");
  });

  static updateBlog = catchAsync(async (req: MulterRequest, res: Response) => {
    let thumbnailUrl = req.body.thumbnail_url;
    let linkUrl = req.body.link;
    let images: Array<{ url: string; alt?: string }> = [];

    if (isFilesObject(req.files) && req.files["thumbnail"]) {
      thumbnailUrl = getFileUrl(req.files["thumbnail"][0]);
    }

    if (isFilesObject(req.files) && req.files["linkImage"]) {
      linkUrl = getFileUrl(req.files["linkImage"][0]);
    }

    if (req.body.keptImages) {
      try {
        images = JSON.parse(req.body.keptImages);
      } catch {
        images = [];
      }
    }

    if (isFilesObject(req.files) && req.files["images"]) {
      const newImages = req.files.images.map((file: any) => ({ url: getFileUrl(file) }));
      images = [...images, ...newImages];
    }

    const updateDto: UpdateBlogDto = {
      title: req.body.title,
      content: req.body.content,
      excerpt: req.body.excerpt,
      // author_name: req.body.author_name,
      // author_id: req.body.author_id,
      category: req.body.category,
      tags: req.body.tags ? (Array.isArray(req.body.tags) ? req.body.tags : req.body.tags.split(',')) : undefined,
      thumbnail_url: thumbnailUrl,
      thumbnail_alt: req.body.thumbnail_alt,
      images: images.length > 0 ? images : undefined,
      link: linkUrl,
      is_published: req.body.is_published !== undefined ? req.body.is_published === 'true' || req.body.is_published === true : undefined,
      is_featured: req.body.is_featured !== undefined ? req.body.is_featured === 'true' || req.body.is_featured === true : undefined,
      meta_title: req.body.meta_title,
      meta_description: req.body.meta_description,
      meta_keywords: req.body.meta_keywords,
      og_image: req.body.og_image,
      canonical_url: req.body.canonical_url,
      noindex: req.body.noindex,
    };
    console.log(updateDto, "updatedto");
    
    const validation = UpdateBlogDto.validate(updateDto);
    if (!validation.valid) {
      throw new AppError(validation.errors.join(', '), 400);
    }

    const blog = await BlogService.updateBlog(req.params.id as string, updateDto);
    return ResponseUtil.success(res, blog, "Blog updated successfully");
  });

  static deleteBlog = catchAsync(async (req: Request, res: Response) => {
    await BlogService.deleteBlog(req.params.id as string);
    return ResponseUtil.success(res, null, "Blog deleted successfully");
  });

  static restoreBlog = catchAsync(async (req: Request, res: Response) => {
    const blog = await BlogService.restoreBlog(req.params.id as string);
    return ResponseUtil.success(res, blog, "Blog restored successfully");
  });

  static togglePublish = catchAsync(async (req: Request, res: Response) => {
    const blog = await BlogService.togglePublish(req.params.id as string);
    return ResponseUtil.success(res, blog, "Blog publish status toggled successfully");
  });

  static uploadImage = catchAsync(async (req: MulterRequest, res: Response) => {
    if (!req.file) {
      throw new AppError("No file uploaded", 400);
    }

    const uploadedFile = UploadService.formatUploadedFile(req.file);
    return ResponseUtil.success(res, {
      url: uploadedFile.url,
      publicId: uploadedFile.publicId,
    }, "Image uploaded successfully");
  });
}
