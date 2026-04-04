import { Router } from "express";
import { BlogController } from "../controllers/blog.controller";
import { protect, restrictTo } from "../../../middlewares/auth.middleware";
import upload from "../../../utils/cloudinary";
import { uploaddata } from "../../../utils/multer";

const router = Router();

router.get("/", BlogController.getAllBlogs);
router.get(
  "/admin",
  protect,
  restrictTo("admin", "superadmin"),
  BlogController.getAllBlogsAdmin,
);
router.get("/:slug", BlogController.getBlogBySlug);

router.post(
  "/",
  protect,
  restrictTo("admin", "superadmin"),
  upload.fields([
    { name: "thumbnail", maxCount: 5 },
    { name: "linkImage", maxCount: 5 }, // optional
    { name: "images", maxCount: 10 },
  ]),
  BlogController.createBlog,
);

router.put(
  "/:id",
  protect,
  restrictTo("admin", "superadmin"),
  upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "linkImage", maxCount: 1 }, // optional
    { name: "images", maxCount: 10 },
  ]),
  BlogController.updateBlog,
);

router.delete(
  "/:id",
  protect,
  restrictTo("admin", "superadmin"),
  BlogController.deleteBlog,
);

router.patch(
  "/:id/toggle",
  protect,
  restrictTo("admin", "superadmin"),
  BlogController.togglePublish,
);

router.post("/upload", uploaddata.single("image"), BlogController.uploadImage);

export default router;
