import { Router } from "express";
import { BlogController } from "../controllers/blog.controller";
import { protect, restrictTo } from "../../../middlewares/auth.middleware";
import upload from "../../../utils/cloudinary";

const router = Router();

router.get("/", BlogController.getAllBlogs);
router.get("/:slug", BlogController.getBlogBySlug);
router.post(
  "/",
  //   upload.single("image"),
  upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "linkImage", maxCount: 1 }, // optional
  ]),
  protect,
  restrictTo("admin", "superadmin"),
  BlogController.createBlog,
);
router.patch(
  "/blogs/:id/toggle",
  protect,
  restrictTo("admin", "superadmin"),
  BlogController.togglePublish,
);
router.post("/upload", upload.single("image"), BlogController.uploadImage);

export default router;
