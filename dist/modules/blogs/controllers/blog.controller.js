"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlogController = void 0;
const errorMessages_1 = require("../../../constants/errorMessages");
const upload_service_1 = require("../../../shared/services/upload.service");
const app_error_util_1 = require("../../../shared/utils/app-error.util");
const response_util_1 = require("../../../shared/utils/response.util");
const catchAsync_1 = require("../../../utils/catchAsync");
const create_blog_dto_1 = require("../dto/create-blog.dto");
const update_blog_dto_1 = require("../dto/update-blog.dto");
const blog_service_1 = require("../services/blog.service");
// Type guard to check if files is an object with field names
function isFilesObject(files) {
    return files && typeof files === 'object' && !Array.isArray(files);
}
// Helper to get file URL from either Cloudinary (secure_url) or local storage (path)
function getFileUrl(file) {
    const cloudinaryFile = file;
    return cloudinaryFile.secure_url || file.path;
}
class BlogController {
    // Public routes
    static getAllPublicBlogs = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const filterDto = {
            ...req.query,
            is_published: true,
        };
        const result = await blog_service_1.BlogService.getAllBlogs(filterDto, false);
        return response_util_1.ResponseUtil.paginated(res, result.blogs, result.pagination, 'Blogs retrieved successfully');
    });
    static getPublicBlogBySlug = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const blog = await blog_service_1.BlogService.getBlogBySlug(req.params.slug);
        if (!blog) {
            throw new app_error_util_1.AppError(`Blog not found for slug: ${req.params.slug}`, 404, {
                userMessage: errorMessages_1.USER_MESSAGES.BLOG_NOT_FOUND,
                errorCode: errorMessages_1.ERROR_CODES.BLOG_NOT_FOUND,
                details: {
                    field: 'slug',
                    reason: 'The blog does not exist or has been deleted.',
                },
            });
        }
        return response_util_1.ResponseUtil.success(res, blog, "Blog retrieved successfully");
    });
    // Admin routes
    static getAllAdminBlogs = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const includeDeleted = req.query.include_deleted === 'true';
        const result = await blog_service_1.BlogService.getAllBlogs(req.query, includeDeleted);
        return response_util_1.ResponseUtil.paginated(res, result.blogs, result.pagination, 'Blogs retrieved successfully');
    });
    static getAdminBlogById = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const blog = await blog_service_1.BlogService.getBlogById(req.params.id);
        if (!blog) {
            throw new app_error_util_1.AppError(`Blog not found for blog_id: ${req.params.id}`, 404, {
                userMessage: errorMessages_1.USER_MESSAGES.BLOG_NOT_FOUND,
                errorCode: errorMessages_1.ERROR_CODES.BLOG_NOT_FOUND,
                details: {
                    field: 'blog_id',
                    reason: 'The blog does not exist or has been deleted.',
                },
            });
        }
        return response_util_1.ResponseUtil.success(res, blog, "Blog retrieved successfully");
    });
    static createBlog = (0, catchAsync_1.catchAsync)(async (req, res) => {
        let thumbnailUrl = req.body.thumbnail_url;
        let linkUrl = req.body.link;
        let images = [];
        if (isFilesObject(req.files) && req.files["thumbnail"]) {
            thumbnailUrl = getFileUrl(req.files["thumbnail"][0]);
        }
        if (isFilesObject(req.files) && req.files["linkImage"]) {
            linkUrl = getFileUrl(req.files["linkImage"][0]);
        }
        if (isFilesObject(req.files) && req.files["images"]) {
            images = req.files.images.map((file) => ({ url: getFileUrl(file) }));
        }
        if (req.body.images) {
            try {
                const parsedImages = JSON.parse(req.body.images);
                images = [...images, ...parsedImages];
            }
            catch {
                // ignore parse errors
            }
        }
        const createDto = {
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
        const validation = create_blog_dto_1.CreateBlogDto.validate(createDto);
        if (!validation.valid) {
            throw new app_error_util_1.AppError(validation.errors.join(', '), 400, {
                userMessage: errorMessages_1.USER_MESSAGES.VALIDATION_ERROR,
                errorCode: errorMessages_1.ERROR_CODES.VALIDATION_ERROR,
                details: {
                    fields: validation.errors,
                },
            });
        }
        const blog = await blog_service_1.BlogService.createBlog(createDto);
        return response_util_1.ResponseUtil.created(res, blog, "Blog created successfully");
    });
    static updateBlog = (0, catchAsync_1.catchAsync)(async (req, res) => {
        let thumbnailUrl = req.body.thumbnail_url;
        let linkUrl = req.body.link;
        let images = [];
        if (isFilesObject(req.files) && req.files["thumbnail"]) {
            thumbnailUrl = getFileUrl(req.files["thumbnail"][0]);
        }
        if (isFilesObject(req.files) && req.files["linkImage"]) {
            linkUrl = getFileUrl(req.files["linkImage"][0]);
        }
        if (req.body.keptImages) {
            try {
                images = JSON.parse(req.body.keptImages);
            }
            catch {
                images = [];
            }
        }
        if (isFilesObject(req.files) && req.files["images"]) {
            const newImages = req.files.images.map((file) => ({ url: getFileUrl(file) }));
            images = [...images, ...newImages];
        }
        const updateDto = {
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
        const validation = update_blog_dto_1.UpdateBlogDto.validate(updateDto);
        if (!validation.valid) {
            throw new app_error_util_1.AppError(validation.errors.join(', '), 400);
        }
        const blog = await blog_service_1.BlogService.updateBlog(req.params.id, updateDto);
        return response_util_1.ResponseUtil.success(res, blog, "Blog updated successfully");
    });
    static deleteBlog = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const blog = await blog_service_1.BlogService.deleteBlog(req.params.id);
        return response_util_1.ResponseUtil.success(res, blog, "Blog deleted successfully");
    });
    static restoreBlog = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const blog = await blog_service_1.BlogService.restoreBlog(req.params.id);
        return response_util_1.ResponseUtil.success(res, blog, "Blog restored successfully");
    });
    static togglePublish = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const blog = await blog_service_1.BlogService.togglePublish(req.params.id);
        return response_util_1.ResponseUtil.success(res, blog, "Blog publish status toggled successfully");
    });
    static uploadImage = (0, catchAsync_1.catchAsync)(async (req, res) => {
        if (!req.file) {
            throw new app_error_util_1.AppError("No file uploaded", 400);
        }
        const uploadedFile = upload_service_1.UploadService.formatUploadedFile(req.file);
        return response_util_1.ResponseUtil.success(res, {
            url: uploadedFile.url,
            publicId: uploadedFile.publicId,
        }, "Image uploaded successfully");
    });
}
exports.BlogController = BlogController;
//# sourceMappingURL=blog.controller.js.map