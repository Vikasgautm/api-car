import { Router } from "express";
import { protect, restrictTo } from "../../../middlewares/auth.middleware";
import { UploadService } from "../../../shared/services/upload.service";
import { validateIdParam, validatePaginationQuery } from "../../../shared/validation";
import { UserController } from "../controllers/user.controller";

const router = Router();
const avatarUpload = UploadService.createUploadMiddleware({
  fieldName: "avatar",
  maxFileSize: 2 * 1024 * 1024, // 2MB
  allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
  useCloudinary: true,
  folder: "avatars",
});

// Public/Protected routes
router.get("/profile", protect, UserController.getProfile);
router.put("/profile", protect, avatarUpload, UserController.updateProfile);

// Admin routes
const adminRouter = Router();
adminRouter.use(protect);
adminRouter.use(restrictTo('admin', 'super_admin'));

adminRouter.get('/', validatePaginationQuery, UserController.getAllAdminUsers);
adminRouter.post('/', UserController.createAdminUser);
adminRouter.get('/:id', validateIdParam, UserController.getAdminUserById);
adminRouter.put('/:id', validateIdParam, UserController.updateUser);
adminRouter.delete('/:id', validateIdParam, UserController.deleteUser);
adminRouter.patch('/restore/:id', validateIdParam, UserController.restoreUser);

router.use('/admin', adminRouter);

export default router;
