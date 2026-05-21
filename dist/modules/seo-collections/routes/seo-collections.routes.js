"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../../middlewares/auth.middleware");
const validation_1 = require("../../../shared/validation");
const seo_collections_controller_1 = require("../controllers/seo-collections.controller");
const router = (0, express_1.Router)();
// Public: hydrate a published collection with live discovery results
router.get('/public/:slug', validation_1.validateSlugParam, seo_collections_controller_1.SeoCollectionsController.getPublicBySlug);
// Admin routes
const adminRouter = (0, express_1.Router)();
adminRouter.use(auth_middleware_1.protect);
adminRouter.use((0, auth_middleware_1.restrictToEditorOrAbove)());
adminRouter.get('/health/summary', seo_collections_controller_1.SeoCollectionsController.healthSummary);
adminRouter.get('/health', seo_collections_controller_1.SeoCollectionsController.health);
adminRouter.get('/', seo_collections_controller_1.SeoCollectionsController.list);
adminRouter.get('/:id', validation_1.validateUuidIdParam, seo_collections_controller_1.SeoCollectionsController.getById);
adminRouter.post('/preview-query', seo_collections_controller_1.SeoCollectionsController.previewQuery);
adminRouter.post('/', seo_collections_controller_1.SeoCollectionsController.create);
adminRouter.put('/:id', validation_1.validateUuidIdParam, seo_collections_controller_1.SeoCollectionsController.update);
adminRouter.delete('/:id', validation_1.validateUuidIdParam, seo_collections_controller_1.SeoCollectionsController.remove);
adminRouter.post('/:id/refresh', validation_1.validateUuidIdParam, seo_collections_controller_1.SeoCollectionsController.refresh);
adminRouter.post('/:id/generate-content', validation_1.validateUuidIdParam, seo_collections_controller_1.SeoCollectionsController.generateContent);
router.use('/admin', adminRouter);
exports.default = router;
//# sourceMappingURL=seo-collections.routes.js.map