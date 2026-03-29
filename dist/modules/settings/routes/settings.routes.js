"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const settings_controller_1 = require("../controllers/settings.controller");
const auth_middleware_1 = require("../../../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.put("/theme", auth_middleware_1.protect, settings_controller_1.SettingsController.updateTheme);
router.post("/theme", auth_middleware_1.protect, settings_controller_1.SettingsController.updateTheme);
exports.default = router;
//# sourceMappingURL=settings.routes.js.map