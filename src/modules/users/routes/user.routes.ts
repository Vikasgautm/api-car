import { Router } from "express";
import { UserController } from "../controllers/user.controller";
import { protect } from "../../../middlewares/auth.middleware";
import upload from "../../../utils/cloudinary";

const router = Router();

router.get("/profile", protect, UserController.getProfile);
router.put("/profile", protect, upload.single("avatar"), UserController.updateProfile);

export default router;
