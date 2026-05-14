"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../../middlewares/auth.middleware");
const validation_1 = require("../../../shared/validation");
const tag_category_controller_1 = require("../controllers/tag-category.controller");
const tag_controller_1 = require("../controllers/tag.controller");
const router = (0, express_1.Router)();
// ----- Public routes -----
router.get('/categories/public', validation_1.validatePaginationQuery, tag_category_controller_1.TagCategoryController.getAllPublic);
router.get('/categories/public/:slug', validation_1.validateSlugParam, tag_category_controller_1.TagCategoryController.getPublicBySlug);
router.get('/tags/public', validation_1.validatePaginationQuery, tag_controller_1.TagController.getAllPublic);
router.get('/tags/public/:slug', validation_1.validateSlugParam, tag_controller_1.TagController.getPublicBySlug);
// ----- Admin routes -----
const adminRouter = (0, express_1.Router)();
adminRouter.use(auth_middleware_1.protect);
adminRouter.use((0, auth_middleware_1.restrictToEditorOrAbove)());
// Tag categories
adminRouter.get('/categories', validation_1.validatePaginationQuery, tag_category_controller_1.TagCategoryController.getAllAdmin);
adminRouter.get('/categories/:id', validation_1.validateUuidIdParam, tag_category_controller_1.TagCategoryController.getAdminById);
adminRouter.post('/categories', tag_category_controller_1.TagCategoryController.create);
adminRouter.put('/categories/:id', validation_1.validateUuidIdParam, tag_category_controller_1.TagCategoryController.update);
adminRouter.delete('/categories/:id', validation_1.validateUuidIdParam, tag_category_controller_1.TagCategoryController.remove);
adminRouter.patch('/categories/restore/:id', validation_1.validateUuidIdParam, tag_category_controller_1.TagCategoryController.restore);
// Tags
adminRouter.get('/tags', validation_1.validatePaginationQuery, tag_controller_1.TagController.getAllAdmin);
adminRouter.get('/tags/:id', validation_1.validateUuidIdParam, tag_controller_1.TagController.getAdminById);
adminRouter.post('/tags', tag_controller_1.TagController.create);
adminRouter.put('/tags/:id', validation_1.validateUuidIdParam, tag_controller_1.TagController.update);
adminRouter.delete('/tags/:id', validation_1.validateUuidIdParam, tag_controller_1.TagController.remove);
adminRouter.patch('/tags/restore/:id', validation_1.validateUuidIdParam, tag_controller_1.TagController.restore);
router.use('/admin', adminRouter);
exports.default = router;
//# sourceMappingURL=taxonomy.routes.js.map