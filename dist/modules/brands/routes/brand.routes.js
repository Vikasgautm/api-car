"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const brand_controller_1 = require("../controllers/brand.controller");
const auth_middleware_1 = require("../../../middlewares/auth.middleware");
const cloudinary_1 = __importDefault(require("../../../utils/cloudinary"));
const router = (0, express_1.Router)();
router.get('/', brand_controller_1.BrandController.getAllBrands);
router.get('/:slug', brand_controller_1.BrandController.getBrandBySlug);
router.post('/', auth_middleware_1.protect, (0, auth_middleware_1.restrictTo)("admin", "superadmin"), cloudinary_1.default.fields([{ name: "images", maxCount: 1 }]), brand_controller_1.BrandController.createBrand);
router.put('/:id', auth_middleware_1.protect, (0, auth_middleware_1.restrictTo)("admin", "superadmin"), cloudinary_1.default.fields([{ name: "images", maxCount: 1 }]), brand_controller_1.BrandController.updateBrand);
router.delete('/:id', auth_middleware_1.protect, (0, auth_middleware_1.restrictTo)("admin", "superadmin"), brand_controller_1.BrandController.deleteBrand);
router.patch('/restore/:id', auth_middleware_1.protect, (0, auth_middleware_1.restrictTo)("admin", "superadmin"), brand_controller_1.BrandController.restoreBrand);
exports.default = router;
//# sourceMappingURL=brand.routes.js.map