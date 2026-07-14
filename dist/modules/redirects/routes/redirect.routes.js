"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../../middlewares/auth.middleware");
const validation_1 = require("../../../shared/validation");
const redirect_controller_1 = require("../controllers/redirect.controller");
const router = (0, express_1.Router)();
// Public: resolve a path through the redirect table (used by frontend).
router.get('/public/resolve', redirect_controller_1.RedirectController.resolvePublic);
// Admin routes
const adminRouter = (0, express_1.Router)();
adminRouter.use(auth_middleware_1.protect);
adminRouter.use((0, auth_middleware_1.restrictTo)('admin', 'super_admin'));
adminRouter.get('/', validation_1.validatePaginationQuery, redirect_controller_1.RedirectController.list);
adminRouter.get('/:id', validation_1.validateUuidIdParam, redirect_controller_1.RedirectController.getById);
adminRouter.post('/', redirect_controller_1.RedirectController.create);
adminRouter.put('/:id', validation_1.validateUuidIdParam, redirect_controller_1.RedirectController.update);
adminRouter.delete('/:id', validation_1.validateUuidIdParam, redirect_controller_1.RedirectController.remove);
adminRouter.patch('/restore/:id', validation_1.validateUuidIdParam, redirect_controller_1.RedirectController.restore);
router.use('/admin', adminRouter);
exports.default = router;
