import { Router } from "express";
import { protect, restrictTo } from "../../../middlewares/auth.middleware";
import { SettingsController } from "../controllers/settings.controller";

const router = Router();

// Theme settings (any authenticated user)
router.put("/theme", protect, SettingsController.updateTheme);
router.post("/theme", protect, SettingsController.updateTheme);

// SEO settings routes
// GET - public (no authentication required)
router.get("/seo", SettingsController.getSEOSettings);
// PUT/POST - admin only
router.put("/seo", protect, restrictTo('admin', 'super_admin'), SettingsController.updateSEOSettings);
router.post("/seo", protect, restrictTo('admin', 'super_admin'), SettingsController.updateSEOSettings);

export default router;
