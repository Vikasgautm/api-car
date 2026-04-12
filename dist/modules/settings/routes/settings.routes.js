"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../../middlewares/auth.middleware");
const settings_controller_1 = require("../controllers/settings.controller");
const router = (0, express_1.Router)();
router.put("/theme", auth_middleware_1.protect, settings_controller_1.SettingsController.updateTheme);
router.post("/theme", auth_middleware_1.protect, settings_controller_1.SettingsController.updateTheme);
// SEO settings routes
router.get("/seo", auth_middleware_1.protect, settings_controller_1.SettingsController.getSEOSettings);
router.put("/seo", auth_middleware_1.protect, settings_controller_1.SettingsController.updateSEOSettings);
router.post("/seo", auth_middleware_1.protect, settings_controller_1.SettingsController.updateSEOSettings);
exports.default = router;
//# sourceMappingURL=settings.routes.js.map