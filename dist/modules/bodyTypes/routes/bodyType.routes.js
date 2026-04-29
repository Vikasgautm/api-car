"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../../middlewares/auth.middleware");
const validation_1 = require("../../../shared/validation");
const bodyType_controller_1 = require("../controllers/bodyType.controller");
const router = (0, express_1.Router)();
// Public routes
router.get('/public', validation_1.validatePaginationQuery, bodyType_controller_1.BodyTypeController.getAllPublicBodyTypes);
router.get('/public/:slug', validation_1.validateSlugParam, bodyType_controller_1.BodyTypeController.getPublicBodyTypeBySlug);
// Admin routes
const adminRouter = (0, express_1.Router)();
adminRouter.use(auth_middleware_1.protect);
adminRouter.use((0, auth_middleware_1.restrictTo)('admin', 'super_admin'));
adminRouter.get('/', validation_1.validatePaginationQuery, bodyType_controller_1.BodyTypeController.getAllAdminBodyTypes);
adminRouter.get('/:id', validation_1.validateUuidIdParam, bodyType_controller_1.BodyTypeController.getAdminBodyTypeById);
adminRouter.post('/', bodyType_controller_1.BodyTypeController.createBodyType);
adminRouter.put('/:id', validation_1.validateUuidIdParam, bodyType_controller_1.BodyTypeController.updateBodyType);
adminRouter.delete('/:id', validation_1.validateUuidIdParam, bodyType_controller_1.BodyTypeController.deleteBodyType);
adminRouter.patch('/restore/:id', validation_1.validateUuidIdParam, bodyType_controller_1.BodyTypeController.restoreBodyType);
adminRouter.patch('/:id/publish', validation_1.validateUuidIdParam, bodyType_controller_1.BodyTypeController.togglePublish);
router.use('/admin', adminRouter);
// Legacy routes for backward compatibility
router.get('/', validation_1.validatePaginationQuery, bodyType_controller_1.BodyTypeController.getAllPublicBodyTypes);
router.get('/:slug', validation_1.validateSlugParam, bodyType_controller_1.BodyTypeController.getPublicBodyTypeBySlug);
exports.default = router;
//# sourceMappingURL=bodyType.routes.js.map