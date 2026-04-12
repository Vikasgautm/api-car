import { Router } from "express";
import { protect } from "../../../middlewares/auth.middleware";
import { SettingsController } from "../controllers/settings.controller";

const router = Router();

router.put("/theme", protect, SettingsController.updateTheme);
router.post("/theme", protect, SettingsController.updateTheme);

// SEO settings routes
router.get("/seo", protect, SettingsController.getSEOSettings);
router.put("/seo", protect, SettingsController.updateSEOSettings);
router.post("/seo", protect, SettingsController.updateSEOSettings);

export default router;
