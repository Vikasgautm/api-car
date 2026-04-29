"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../../middlewares/auth.middleware");
const settings_controller_1 = require("../controllers/settings.controller");
const router = (0, express_1.Router)();
// Theme settings (any authenticated user)
router.put("/theme", auth_middleware_1.protect, settings_controller_1.SettingsController.updateTheme);
router.post("/theme", auth_middleware_1.protect, settings_controller_1.SettingsController.updateTheme);
// SEO settings routes
// GET - public (no authentication required)
router.get("/seo", settings_controller_1.SettingsController.getSEOSettings);
// PUT/POST - admin only
router.put("/seo", auth_middleware_1.protect, (0, auth_middleware_1.restrictTo)('admin', 'super_admin'), settings_controller_1.SettingsController.updateSEOSettings);
router.post("/seo", auth_middleware_1.protect, (0, auth_middleware_1.restrictTo)('admin', 'super_admin'), settings_controller_1.SettingsController.updateSEOSettings);
exports.default = router;
//# sourceMappingURL=settings.routes.js.map