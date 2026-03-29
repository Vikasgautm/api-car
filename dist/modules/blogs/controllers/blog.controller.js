"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlogController = void 0;
const blog_service_1 = require("../services/blog.service");
const catchAsync_1 = require("../../../utils/catchAsync");
const error_middleware_1 = require("../../../middlewares/error.middleware");
const seo_1 = require("../../../utils/seo");
class BlogController {
    static getAllBlogs = (0, catchAsync_1.catchAsync)(async (req, res) => {
        // Public route, only fetch published
        const result = await blog_service_1.BlogService.getAllBlogs(req.query, false);
        res.status(200).json({
            status: "success",
            data: result,
        });
    });
    static getAllBlogsAdmin = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const result = await blog_service_1.BlogService.getAllBlogs(req.query, true);
        res.status(200).json({
            status: "success",
            data: result,
        });
    });
    static getBlogBySlug = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const blog = await blog_service_1.BlogService.getBlogBySlug(req.params.slug);
        if (!blog) {
            throw new error_middleware_1.AppError("Blog not found", 404);
        }
        const metadata = (0, seo_1.generateBlogMetadata)(blog);
        res.status(200).json({
            status: "success",
            data: {
                blog,
                seo: metadata,
            },
        });
    });
    static createBlog = (0, catchAsync_1.catchAsync)(async (req, res) => {
        let thumbnail = {
            url: "",
            title: req.body.thumbnailTitle || "",
            preview: ""
        };
        let link = req.body.link || "";
        if (req.files?.["thumbnail"]) {
            const file = req.files["thumbnail"][0];
            thumbnail.url = file.path;
        }
        if (req.files?.["linkImage"]) {
            const file = req.files["linkImage"][0];
            link = file.path;
        }
        const blog = await blog_service_1.BlogService.createBlog({
            title: req.body.title,
            content: req.body.content,
            author: req.body.author,
            category: req.body.category || "Uncategorized",
            slug: req.body.slug,
            link,
            thumbnail,
            is_published: req.body.is_published === "true" || req.body.is_published === true,
        });
        res.status(201).json({
            status: "success",
            data: { blog },
        });
    });
    static updateBlog = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const id = req.params.id;
        let blogData = { ...req.body };
        if (req.files?.["thumbnail"]) {
            const file = req.files["thumbnail"][0];
            blogData.thumbnail = {
                url: file.path,
                title: req.body.thumbnailTitle || "",
                preview: ""
            };
        }
        if (req.files?.["linkImage"]) {
            const file = req.files["linkImage"][0];
            blogData.link = file.path;
        }
        // convert string to boolean
        if (typeof req.body.is_published !== "undefined") {
            blogData.is_published = req.body.is_published === "true" || req.body.is_published === true;
        }
        const updatedBlog = await blog_service_1.BlogService.updateBlog(id, blogData);
        if (!updatedBlog) {
            throw new error_middleware_1.AppError("Blog not found", 404);
        }
        res.status(200).json({
            status: "success",
            data: { blog: updatedBlog },
        });
    });
    static deleteBlog = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const id = req.params.id;
        const deletedBlog = await blog_service_1.BlogService.deleteBlog(id);
        if (!deletedBlog) {
            throw new error_middleware_1.AppError("Blog not found", 404);
        }
        res.status(200).json({
            status: "success",
            message: "Blog deleted successfully"
        });
    });
    static togglePublish = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const blog = await blog_service_1.BlogService.findBlogById(req.params.id);
        if (!blog) {
            throw new error_middleware_1.AppError("Blog not found", 404);
        }
        blog.is_published = !blog.is_published;
        await blog.save();
        res.json({ status: "success", data: blog });
    });
    static uploadImage = (0, catchAsync_1.catchAsync)(async (req, res) => {
        if (!req.file) {
            return res.status(400).json({
                status: "fail",
                message: "No file uploaded",
            });
        }
        res.status(200).json({
            status: "success",
            url: req.file.path,
        });
    });
}
exports.BlogController = BlogController;
//# sourceMappingURL=blog.controller.js.map