"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlogService = void 0;
const sanitize_util_1 = require("../../../shared/utils/sanitize.util");
const uuid_1 = require("uuid");
const errorMessages_1 = require("../../../constants/errorMessages");
const blog_model_1 = require("../../../models/blog.model");
const app_error_util_1 = require("../../../shared/utils/app-error.util");
const filter_util_1 = require("../../../shared/utils/filter.util");
const pagination_util_1 = require("../../../shared/utils/pagination.util");
const slug_util_1 = require("../../../shared/utils/slug.util");
class BlogService {
    static async getAllBlogs(filterDto, includeDeleted = false) {
        const { page = 1, limit = 10, q, category, author_id, tags, is_published, is_featured, is_deleted, sortBy = 'createdAt', sortOrder = 'desc', } = filterDto;
        const filter = {};
        if (is_deleted === 'true' || is_deleted === true) {
            filter.is_deleted = true;
        }
        else if (!includeDeleted) {
            filter.is_deleted = false;
        }
        if (is_published !== undefined) {
            filter.is_published = is_published;
        }
        if (is_featured !== undefined) {
            filter.is_featured = is_featured;
        }
        if (category !== undefined) {
            filter.category = category;
        }
        if (author_id !== undefined) {
            filter.author_id = author_id;
        }
        if (q) {
            const searchFilter = filter_util_1.FilterUtil.buildSearchFilter(['title', 'excerpt', 'content'], q);
            Object.assign(filter, searchFilter);
        }
        if (tags !== undefined) {
            const tagsArray = Array.isArray(tags) ? tags : tags.split(',');
            filter.tags = { $in: tagsArray };
        }
        const { skip, limit: validatedLimit } = pagination_util_1.PaginationUtil.getPaginationParams(page, limit);
        const sortFilter = filter_util_1.FilterUtil.buildSortFilter(sortBy, sortOrder);
        const blogs = await blog_model_1.Blog.find(filter)
            .select('blog_id title slug excerpt content author_name author_id category tags thumbnail link is_published is_featured createdAt updatedAt')
            .sort(sortFilter)
            .skip(skip)
            .limit(validatedLimit)
            .lean();
        const total = await blog_model_1.Blog.countDocuments(filter);
        const paginationMeta = pagination_util_1.PaginationUtil.createPaginationMeta(page, validatedLimit, total);
        return { blogs, pagination: paginationMeta };
    }
    static async getBlogById(blogId) {
        return await blog_model_1.Blog.findOne({ blog_id: blogId, is_deleted: false });
    }
    static async getBlogBySlug(slug) {
        return await blog_model_1.Blog.findOne({ slug, is_deleted: false, is_published: true });
    }
    static async findBlogById(id) {
        return await blog_model_1.Blog.findById(id);
    }
    static async createBlog(blogData) {
        const blog_id = (0, uuid_1.v4)();
        const slug = slug_util_1.SlugUtil.generate(blogData.title);
        const existingSlug = await blog_model_1.Blog.findOne({ slug, is_deleted: false });
        if (existingSlug) {
            const baseSlug = slug;
            const pattern = new RegExp(`^${baseSlug}(-\\d+)?$`);
            const matchingSlugs = (await blog_model_1.Blog.find({ slug: pattern, is_deleted: false }).select('slug').lean()).map((b) => b.slug);
            const uniqueSlug = slug_util_1.SlugUtil.generateUnique(blogData.title, matchingSlugs);
            blogData.slug = uniqueSlug;
        }
        else {
            blogData.slug = slug;
        }
        // Sanitize HTML content
        const sanitizedContent = blogData.content ? (0, sanitize_util_1.sanitizeHtml)(blogData.content) : '';
        let excerpt = blogData.excerpt;
        if (!excerpt && sanitizedContent) {
            excerpt = sanitizedContent.replace(/<[^>]+>/g, "").substring(0, 150) + "...";
        }
        const blog = {
            blog_id,
            title: blogData.title,
            slug: blogData.slug,
            excerpt,
            content: sanitizedContent,
            // author_name: blogData.author_name,
            // author_id: blogData.author_id,
            category: blogData.category,
            tags: blogData.tags,
            thumbnail: blogData.thumbnail_url ? {
                url: blogData.thumbnail_url,
                alt: blogData.thumbnail_alt,
            } : undefined,
            images: blogData.images,
            link: blogData.link,
            is_published: blogData.is_published || false,
            is_featured: blogData.is_featured || false,
            is_deleted: false,
            meta_title: blogData.meta_title,
            meta_description: blogData.meta_description,
            meta_keywords: blogData.meta_keywords,
            og_image: blogData.og_image,
            canonical_url: blogData.canonical_url,
            noindex: blogData.noindex,
            article_type: blogData.article_type,
            article_status: blogData.article_status ?? 'draft',
            article_intent: blogData.article_intent,
            target_keyword: blogData.target_keyword,
            connected_cars: blogData.connected_cars ?? [],
            connected_variants: blogData.connected_variants ?? [],
            connected_brands: blogData.connected_brands ?? [],
            connected_body_types: blogData.connected_body_types ?? [],
            connected_fuel_types: blogData.connected_fuel_types ?? [],
            connected_comparisons: blogData.connected_comparisons ?? [],
            connected_collections: blogData.connected_collections ?? [],
            freshness_score: 100,
        };
        return await blog_model_1.Blog.create(blog);
    }
    static async updateBlog(blogId, blogData) {
        const updateData = {};
        if (blogData.title !== undefined) {
            updateData.title = blogData.title;
            const newSlug = slug_util_1.SlugUtil.generate(blogData.title);
            const existingSlug = await blog_model_1.Blog.findOne({ slug: newSlug, blog_id: { $ne: blogId }, is_deleted: false });
            if (!existingSlug) {
                updateData.slug = newSlug;
            }
        }
        if (blogData.content !== undefined) {
            // Sanitize HTML content
            const sanitizedContent = (0, sanitize_util_1.sanitizeHtml)(blogData.content);
            updateData.content = sanitizedContent;
            if (!blogData.excerpt) {
                updateData.excerpt = sanitizedContent.replace(/<[^>]+>/g, "").substring(0, 150) + "...";
            }
        }
        // if (blogData.author_name !== undefined) updateData.author_name = blogData.author_name;
        // if (blogData.author_id !== undefined) updateData.author_id = blogData.author_id;
        if (blogData.category !== undefined)
            updateData.category = blogData.category;
        if (blogData.tags !== undefined)
            updateData.tags = blogData.tags;
        if (blogData.thumbnail_url !== undefined) {
            updateData.thumbnail = {
                url: blogData.thumbnail_url,
                alt: blogData.thumbnail_alt,
            };
        }
        if (blogData.images !== undefined)
            updateData.images = blogData.images;
        if (blogData.link !== undefined)
            updateData.link = blogData.link;
        if (blogData.is_published !== undefined)
            updateData.is_published = blogData.is_published;
        if (blogData.is_featured !== undefined)
            updateData.is_featured = blogData.is_featured;
        if (blogData.meta_title !== undefined)
            updateData.meta_title = blogData.meta_title;
        if (blogData.meta_description !== undefined)
            updateData.meta_description = blogData.meta_description;
        if (blogData.meta_keywords !== undefined)
            updateData.meta_keywords = blogData.meta_keywords;
        if (blogData.og_image !== undefined)
            updateData.og_image = blogData.og_image;
        if (blogData.canonical_url !== undefined)
            updateData.canonical_url = blogData.canonical_url;
        if (blogData.noindex !== undefined)
            updateData.noindex = blogData.noindex;
        if (blogData.excerpt !== undefined)
            updateData.excerpt = blogData.excerpt;
        if (blogData.article_type !== undefined)
            updateData.article_type = blogData.article_type;
        if (blogData.article_status !== undefined)
            updateData.article_status = blogData.article_status;
        if (blogData.article_intent !== undefined)
            updateData.article_intent = blogData.article_intent;
        if (blogData.target_keyword !== undefined)
            updateData.target_keyword = blogData.target_keyword;
        if (blogData.connected_cars !== undefined)
            updateData.connected_cars = blogData.connected_cars;
        if (blogData.connected_variants !== undefined)
            updateData.connected_variants = blogData.connected_variants;
        if (blogData.connected_brands !== undefined)
            updateData.connected_brands = blogData.connected_brands;
        if (blogData.connected_body_types !== undefined)
            updateData.connected_body_types = blogData.connected_body_types;
        if (blogData.connected_fuel_types !== undefined)
            updateData.connected_fuel_types = blogData.connected_fuel_types;
        if (blogData.connected_comparisons !== undefined)
            updateData.connected_comparisons = blogData.connected_comparisons;
        if (blogData.connected_collections !== undefined)
            updateData.connected_collections = blogData.connected_collections;
        const blog = await blog_model_1.Blog.findOneAndUpdate({ blog_id: blogId, is_deleted: false }, updateData, { returnDocument: 'after' });
        if (!blog) {
            throw new app_error_util_1.AppError(`Blog not found or deleted for blog_id: ${blogId}`, 404, {
                userMessage: errorMessages_1.USER_MESSAGES.BLOG_NOT_FOUND,
                errorCode: errorMessages_1.ERROR_CODES.BLOG_NOT_FOUND,
                details: {
                    field: 'blog_id',
                    reason: 'The blog does not exist or has already been deleted.',
                },
            });
        }
        return blog;
    }
    static async deleteBlog(blogId) {
        const blog = await blog_model_1.Blog.findOneAndUpdate({ blog_id: blogId, is_deleted: false }, { is_deleted: true }, { returnDocument: 'after' });
        if (!blog) {
            throw new app_error_util_1.AppError(`Blog not found or deleted for blog_id: ${blogId}`, 404, {
                userMessage: errorMessages_1.USER_MESSAGES.BLOG_NOT_FOUND,
                errorCode: errorMessages_1.ERROR_CODES.BLOG_NOT_FOUND,
                details: {
                    field: 'blog_id',
                    reason: 'The blog does not exist or has already been deleted.',
                },
            });
        }
        return blog;
    }
    static async restoreBlog(blogId) {
        const blog = await blog_model_1.Blog.findOneAndUpdate({ blog_id: blogId, is_deleted: true }, { is_deleted: false }, { returnDocument: 'after' });
        if (!blog) {
            throw new app_error_util_1.AppError(`Blog not found for blog_id: ${blogId}`, 404, {
                userMessage: errorMessages_1.USER_MESSAGES.BLOG_NOT_FOUND,
                errorCode: errorMessages_1.ERROR_CODES.BLOG_NOT_FOUND,
                details: {
                    field: 'blog_id',
                    reason: 'The blog does not exist in the deleted records.',
                },
            });
        }
        return blog;
    }
    static async togglePublish(blogId) {
        const blog = await blog_model_1.Blog.findOne({ blog_id: blogId, is_deleted: false });
        if (!blog) {
            throw new app_error_util_1.AppError(`Blog not found or deleted for blog_id: ${blogId}`, 404, {
                userMessage: errorMessages_1.USER_MESSAGES.BLOG_NOT_FOUND,
                errorCode: errorMessages_1.ERROR_CODES.BLOG_NOT_FOUND,
                details: {
                    field: 'blog_id',
                    reason: 'The blog does not exist or has been deleted.',
                },
            });
        }
        blog.is_published = !blog.is_published;
        await blog.save();
        return blog;
    }
}
exports.BlogService = BlogService;
