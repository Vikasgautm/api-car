"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlogController = void 0;
const validation_1 = require("../../../shared/validation");
const errorMessages_1 = require("../../../constants/errorMessages");
const upload_service_1 = require("../../../shared/services/upload.service");
const app_error_util_1 = require("../../../shared/utils/app-error.util");
const response_util_1 = require("../../../shared/utils/response.util");
const catchAsync_1 = require("../../../utils/catchAsync");
const blog_service_1 = require("../services/blog.service");
const blog_relationship_service_1 = require("../services/blog-relationship.service");
const blog_query_service_1 = require("../services/blog-query.service");
const blog_health_service_1 = require("../services/blog-health.service");
const blog_freshness_service_1 = require("../services/blog-freshness.service");
const blog_activity_service_1 = require("../services/blog-activity.service");
const blog_related_service_1 = require("../services/blog-related.service");
const blog_linking_service_1 = require("../services/blog-linking.service");
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
        const validation = validation_1.createBlogSchema.safeParse(createDto);
        if (!validation.success) {
            throw new app_error_util_1.AppError(validation.error.errors.map(e => e.message).join(', '), 400, {
                userMessage: errorMessages_1.USER_MESSAGES.VALIDATION_ERROR,
                errorCode: errorMessages_1.ERROR_CODES.VALIDATION_ERROR,
                details: {
                    fields: validation.error.errors.map(e => e.message),
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
        const validation = validation_1.updateBlogSchema.safeParse(updateDto);
        if (!validation.success) {
            throw new app_error_util_1.AppError(validation.error.errors.map(e => e.message).join(', '), 400);
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
    // Entity connectivity
    static updateConnections = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const blog = await blog_relationship_service_1.BlogRelationshipService.updateConnections(req.params['id'], req.body);
        return response_util_1.ResponseUtil.success(res, blog, "Blog connections updated");
    });
    static getConnections = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const data = await blog_relationship_service_1.BlogRelationshipService.getRelatedEntityNames(req.params['id']);
        return response_util_1.ResponseUtil.success(res, data, "Blog connections retrieved");
    });
    // Related blogs by entity
    static getRelatedByCar = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const limit = parseInt(req.query.limit) || 5;
        const blogs = await blog_query_service_1.BlogQueryService.getRelatedByCar(req.params['carId'], limit);
        return response_util_1.ResponseUtil.success(res, blogs, "Related blogs retrieved");
    });
    static getRelatedByBrand = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const limit = parseInt(req.query.limit) || 5;
        const blogs = await blog_query_service_1.BlogQueryService.getRelatedByBrand(req.params['brandId'], limit);
        return response_util_1.ResponseUtil.success(res, blogs, "Related blogs retrieved");
    });
    static getRelatedByFuel = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const limit = parseInt(req.query.limit) || 5;
        const blogs = await blog_query_service_1.BlogQueryService.getRelatedByFuelType(req.params['fuelId'], limit);
        return response_util_1.ResponseUtil.success(res, blogs, "Related blogs retrieved");
    });
    static getRelatedByBodyType = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const limit = parseInt(req.query.limit) || 5;
        const blogs = await blog_query_service_1.BlogQueryService.getRelatedByBodyType(req.params['bodyTypeId'], limit);
        return response_util_1.ResponseUtil.success(res, blogs, "Related blogs retrieved");
    });
    static getRelatedByComparison = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const limit = parseInt(req.query.limit) || 5;
        const blogs = await blog_query_service_1.BlogQueryService.getRelatedByComparison(req.params['comparisonId'], limit);
        return response_util_1.ResponseUtil.success(res, blogs, "Related blogs retrieved");
    });
    static getRelatedArticles = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const limit = parseInt(req.query.limit) || 5;
        const blogs = await blog_related_service_1.BlogRelatedService.getRelatedArticles(req.params['id'], limit);
        return response_util_1.ResponseUtil.success(res, blogs, "Related articles retrieved");
    });
    // SEO health
    static getSeoHealth = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const result = await blog_health_service_1.BlogHealthService.computeForBlog(req.params['id']);
        return response_util_1.ResponseUtil.success(res, result, "SEO health computed");
    });
    static runBulkHealthCheck = (0, catchAsync_1.catchAsync)(async (_req, res) => {
        const result = await blog_health_service_1.BlogHealthService.computeBulk();
        return response_util_1.ResponseUtil.success(res, result, "Bulk health check complete");
    });
    // Freshness
    static checkFreshness = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const result = await blog_freshness_service_1.BlogFreshnessService.checkBlog(req.params['id']);
        return response_util_1.ResponseUtil.success(res, result, "Freshness check complete");
    });
    static runBulkFreshnessCheck = (0, catchAsync_1.catchAsync)(async (_req, res) => {
        const result = await blog_freshness_service_1.BlogFreshnessService.runBulkFreshnessCheck();
        return response_util_1.ResponseUtil.success(res, result, "Bulk freshness check complete");
    });
    // Activity & dashboard
    static getActivity = (0, catchAsync_1.catchAsync)(async (_req, res) => {
        const activity = await blog_activity_service_1.BlogActivityService.getRecentActivity();
        return response_util_1.ResponseUtil.success(res, activity, "Blog activity retrieved");
    });
    static getStaleAlerts = (0, catchAsync_1.catchAsync)(async (_req, res) => {
        const alerts = await blog_activity_service_1.BlogActivityService.getStaleAlerts();
        return response_util_1.ResponseUtil.success(res, alerts, "Stale alerts retrieved");
    });
    static getContentHealthSummary = (0, catchAsync_1.catchAsync)(async (_req, res) => {
        const summary = await blog_activity_service_1.BlogActivityService.getContentHealthSummary();
        return response_util_1.ResponseUtil.success(res, summary, "Content health summary retrieved");
    });
    static getEntityImpactAlerts = (0, catchAsync_1.catchAsync)(async (_req, res) => {
        const alerts = await blog_activity_service_1.BlogActivityService.getEntityImpactAlerts();
        return response_util_1.ResponseUtil.success(res, alerts, "Entity impact alerts retrieved");
    });
    // Internal link suggestions
    static suggestLinks = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const { content } = req.body;
        const suggestions = await blog_linking_service_1.BlogLinkingService.suggestLinks(content ?? '');
        return response_util_1.ResponseUtil.success(res, suggestions, "Link suggestions generated");
    });
    static searchEntities = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const { q, type } = req.query;
        const results = await blog_linking_service_1.BlogLinkingService.searchEntities(q ?? '', type ?? 'car');
        return response_util_1.ResponseUtil.success(res, results, "Entity search results");
    });
}
exports.BlogController = BlogController;
