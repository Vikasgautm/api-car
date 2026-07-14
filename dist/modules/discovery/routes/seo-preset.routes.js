"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../../middlewares/auth.middleware");
const validation_1 = require("../../../shared/validation");
const seo_preset_controller_1 = require("../controllers/seo-preset.controller");
const router = (0, express_1.Router)();
// Public hydration: resolve preset + matching cars in one call.
router.get('/public/:slug', validation_1.validateSlugParam, seo_preset_controller_1.SeoPresetController.getPublicBySlug);
const adminRouter = (0, express_1.Router)();
adminRouter.use(auth_middleware_1.protect);
adminRouter.use((0, auth_middleware_1.restrictToEditorOrAbove)());
adminRouter.get('/', seo_preset_controller_1.SeoPresetController.list);
adminRouter.get('/:id', validation_1.validateUuidIdParam, seo_preset_controller_1.SeoPresetController.getById);
adminRouter.post('/', seo_preset_controller_1.SeoPresetController.create);
adminRouter.put('/:id', validation_1.validateUuidIdParam, seo_preset_controller_1.SeoPresetController.update);
adminRouter.delete('/:id', validation_1.validateUuidIdParam, seo_preset_controller_1.SeoPresetController.remove);
router.use('/admin', adminRouter);
exports.default = router;
