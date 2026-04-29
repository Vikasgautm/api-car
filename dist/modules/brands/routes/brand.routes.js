"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../../middlewares/auth.middleware");
const upload_service_1 = require("../../../shared/services/upload.service");
const validation_1 = require("../../../shared/validation");
const brand_controller_1 = require("../controllers/brand.controller");
const router = (0, express_1.Router)();
// Public routes
router.get('/public', validation_1.validatePaginationQuery, brand_controller_1.BrandController.getAllPublicBrands);
router.get('/public/:slug', validation_1.validateSlugParam, brand_controller_1.BrandController.getPublicBrandBySlug);
// Admin routes
const adminRouter = (0, express_1.Router)();
adminRouter.use(auth_middleware_1.protect);
adminRouter.use((0, auth_middleware_1.restrictTo)('admin', 'super_admin'));
adminRouter.get('/', validation_1.validatePaginationQuery, brand_controller_1.BrandController.getAllAdminBrands);
adminRouter.get('/:id', validation_1.validateUuidIdParam, brand_controller_1.BrandController.getAdminBrandById);
const logoUpload = upload_service_1.UploadService.createUploadMiddleware({
    fieldName: 'logo',
    maxFileSize: 2 * 1024 * 1024,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    useCloudinary: true,
    folder: 'brands',
});
adminRouter.post('/', logoUpload, brand_controller_1.BrandController.createBrand);
adminRouter.put('/:id', validation_1.validateUuidIdParam, logoUpload, brand_controller_1.BrandController.updateBrand);
adminRouter.delete('/:id', validation_1.validateUuidIdParam, brand_controller_1.BrandController.deleteBrand);
adminRouter.patch('/restore/:id', validation_1.validateUuidIdParam, brand_controller_1.BrandController.restoreBrand);
adminRouter.patch('/:id/publish', validation_1.validateUuidIdParam, brand_controller_1.BrandController.togglePublish);
router.use('/admin', adminRouter);
// Legacy routes for backward compatibility
router.get('/', validation_1.validatePaginationQuery, brand_controller_1.BrandController.getAllPublicBrands);
router.get('/:slug', validation_1.validateSlugParam, brand_controller_1.BrandController.getPublicBrandBySlug);
exports.default = router;
//# sourceMappingURL=brand.routes.js.map