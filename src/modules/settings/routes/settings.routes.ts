import { Router } from "express";
import { SettingsController } from "../controllers/settings.controller";
import { protect } from "../../../middlewares/auth.middleware";

const router = Router();

router.put("/theme", protect, SettingsController.updateTheme);
router.post("/theme", protect, SettingsController.updateTheme);

export default router;
