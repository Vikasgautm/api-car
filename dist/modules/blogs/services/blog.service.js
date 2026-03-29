"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlogService = void 0;
const blog_model_1 = require("../../../models/blog.model");
const uuid_1 = require("uuid");
const slugify_1 = require("../../../utils/slugify");
const cloudinary_1 = require("cloudinary");
class BlogService {
    static async getAllBlogs(query, isAdmin = false) {
        const { q, category, page = 1, limit = 10 } = query;
        const filter = { is_deleted: false };
        if (!isAdmin) {
            filter.is_published = true;
        }
        if (q) {
            filter.$or = [
                { title: { $regex: q, $options: "i" } },
                { content: { $regex: q, $options: "i" } },
            ];
        }
        if (category) {
            filter.category = category;
        }
        const skip = ((Number(page) || 1) - 1) * (Number(limit) || 10);
        const blogs = await blog_model_1.Blog.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit) || 10);
        const total = await blog_model_1.Blog.countDocuments(filter);
        return { blogs, total, page: Number(page) || 1, limit: Number(limit) || 10 };
    }
    static async getBlogBySlug(slug) {
        return await blog_model_1.Blog.findOne({ slug, is_deleted: false, is_published: true });
    }
    static async findBlogById(id) {
        return await blog_model_1.Blog.findById(id);
    }
    static async createBlog(blogData) {
        const blog_id = (0, uuid_1.v4)();
        let slug = (0, slugify_1.generateSlug)(blogData.title);
        // Ensure unique slug
        const existing = await blog_model_1.Blog.findOne({ slug });
        if (existing) {
            slug = `${slug}-${Date.now()}`;
        }
        let excerpt = blogData.excerpt;
        if (!excerpt && blogData.content) {
            excerpt = blogData.content.replace(/<[^>]+>/g, "").substring(0, 150) + "...";
        }
        return await blog_model_1.Blog.create({
            ...blogData,
            excerpt,
            blog_id,
            slug,
        });
    }
    static async updateBlog(id, blogData) {
        if (blogData.title) {
            blogData.slug = (0, slugify_1.generateSlug)(blogData.title);
        }
        if (!blogData.excerpt && blogData.content) {
            blogData.excerpt = blogData.content.replace(/<[^>]+>/g, "").substring(0, 150) + "...";
        }
        return await blog_model_1.Blog.findByIdAndUpdate(id, blogData, { new: true });
    }
    static async deleteBlog(id) {
        const blog = await blog_model_1.Blog.findById(id);
        if (blog) {
            if (blog.thumbnail?.url) {
                const publicIdMatch = blog.thumbnail.url.match(/\/v\d+\/(.+?)\.\w+$/);
                if (publicIdMatch && publicIdMatch[1]) {
                    try {
                        await cloudinary_1.v2.uploader.destroy(publicIdMatch[1]);
                    }
                    catch (e) {
                        console.error("Cloudinary delete error:", e);
                    }
                }
            }
            return await blog_model_1.Blog.findByIdAndDelete(id);
        }
        return null;
    }
}
exports.BlogService = BlogService;
//# sourceMappingURL=blog.service.js.map