"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../../middlewares/auth.middleware");
const upload_service_1 = require("../../../shared/services/upload.service");
const validation_1 = require("../../../shared/validation");
const user_controller_1 = require("../controllers/user.controller");
const router = (0, express_1.Router)();
const avatarUpload = upload_service_1.UploadService.createUploadMiddleware({
    fieldName: "avatar",
    maxFileSize: 2 * 1024 * 1024, // 2MB
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    useCloudinary: true,
    folder: "avatars",
});
// Public/Protected routes
router.get("/profile", auth_middleware_1.protect, user_controller_1.UserController.getProfile);
router.put("/profile", auth_middleware_1.protect, avatarUpload, user_controller_1.UserController.updateProfile);
// Admin routes
const adminRouter = (0, express_1.Router)();
adminRouter.use(auth_middleware_1.protect);
adminRouter.use((0, auth_middleware_1.restrictTo)('admin', 'super_admin'));
adminRouter.get('/', validation_1.validatePaginationQuery, user_controller_1.UserController.getAllAdminUsers);
adminRouter.get('/:id', validation_1.validateIdParam, user_controller_1.UserController.getAdminUserById);
adminRouter.put('/:id', validation_1.validateIdParam, user_controller_1.UserController.updateUser);
adminRouter.delete('/:id', validation_1.validateIdParam, user_controller_1.UserController.deleteUser);
adminRouter.patch('/restore/:id', validation_1.validateIdParam, user_controller_1.UserController.restoreUser);
router.use('/admin', adminRouter);
exports.default = router;
//# sourceMappingURL=user.routes.js.map