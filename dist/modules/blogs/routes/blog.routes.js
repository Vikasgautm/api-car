"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const blog_controller_1 = require("../controllers/blog.controller");
const auth_middleware_1 = require("../../../middlewares/auth.middleware");
const cloudinary_1 = __importDefault(require("../../../utils/cloudinary"));
const multer_1 = require("../../../utils/multer");
const router = (0, express_1.Router)();
router.get("/", blog_controller_1.BlogController.getAllBlogs);
router.get("/admin", auth_middleware_1.protect, (0, auth_middleware_1.restrictTo)("admin", "superadmin"), blog_controller_1.BlogController.getAllBlogsAdmin);
router.get("/:slug", blog_controller_1.BlogController.getBlogBySlug);
router.post("/", auth_middleware_1.protect, (0, auth_middleware_1.restrictTo)("admin", "superadmin"), cloudinary_1.default.fields([
    { name: "thumbnail", maxCount: 5 },
    { name: "linkImage", maxCount: 5 }, // optional
    { name: "images", maxCount: 10 },
]), blog_controller_1.BlogController.createBlog);
router.put("/:id", auth_middleware_1.protect, (0, auth_middleware_1.restrictTo)("admin", "superadmin"), cloudinary_1.default.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "linkImage", maxCount: 1 }, // optional
    { name: "images", maxCount: 10 },
]), blog_controller_1.BlogController.updateBlog);
router.delete("/:id", auth_middleware_1.protect, (0, auth_middleware_1.restrictTo)("admin", "superadmin"), blog_controller_1.BlogController.deleteBlog);
router.patch("/:id/toggle", auth_middleware_1.protect, (0, auth_middleware_1.restrictTo)("admin", "superadmin"), blog_controller_1.BlogController.togglePublish);
router.post("/upload", multer_1.uploaddata.single("image"), blog_controller_1.BlogController.uploadImage);
exports.default = router;
//# sourceMappingURL=blog.routes.js.map