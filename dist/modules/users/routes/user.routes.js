"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = require("../controllers/user.controller");
const auth_middleware_1 = require("../../../middlewares/auth.middleware");
const cloudinary_1 = __importDefault(require("../../../utils/cloudinary"));
const router = (0, express_1.Router)();
router.get("/profile", auth_middleware_1.protect, user_controller_1.UserController.getProfile);
router.put("/profile", auth_middleware_1.protect, cloudinary_1.default.single("avatar"), user_controller_1.UserController.updateProfile);
exports.default = router;
//# sourceMappingURL=user.routes.js.map