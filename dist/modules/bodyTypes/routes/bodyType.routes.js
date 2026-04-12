"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bodyType_controller_1 = require("../controllers/bodyType.controller");
const auth_middleware_1 = require("../../../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.get('/', bodyType_controller_1.BodyTypeController.getAllBodyTypes);
router.get('/:slug', bodyType_controller_1.BodyTypeController.getBodyTypeBySlug);
router.post('/', auth_middleware_1.protect, (0, auth_middleware_1.restrictTo)("admin", "superadmin"), bodyType_controller_1.BodyTypeController.createBodyType);
router.put('/:id', auth_middleware_1.protect, (0, auth_middleware_1.restrictTo)("admin", "superadmin"), bodyType_controller_1.BodyTypeController.updateBodyType);
router.delete('/:id', auth_middleware_1.protect, (0, auth_middleware_1.restrictTo)("admin", "superadmin"), bodyType_controller_1.BodyTypeController.deleteBodyType);
router.patch('/restore/:id', auth_middleware_1.protect, (0, auth_middleware_1.restrictTo)("admin", "superadmin"), bodyType_controller_1.BodyTypeController.restoreBodyType);
exports.default = router;
//# sourceMappingURL=bodyType.routes.js.map