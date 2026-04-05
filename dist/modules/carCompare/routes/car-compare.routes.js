"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const car_compare_controller_1 = require("../controllers/car-compare.controller");
const auth_middleware_1 = require("../../../middlewares/auth.middleware");
const cloudinary_1 = __importDefault(require("../../../utils/cloudinary"));
const router = (0, express_1.Router)();
router.get('/', car_compare_controller_1.CarCompareController.getAllComparisons);
router.get('/:route', car_compare_controller_1.CarCompareController.getComparisonByRoute);
router.post('/', auth_middleware_1.protect, (0, auth_middleware_1.restrictTo)('admin', 'superadmin'), cloudinary_1.default.fields([{ name: "images", maxCount: 10 }]), car_compare_controller_1.CarCompareController.createComparison);
router.put('/:id', auth_middleware_1.protect, (0, auth_middleware_1.restrictTo)('admin', 'superadmin'), cloudinary_1.default.fields([{ name: "images", maxCount: 10 }]), car_compare_controller_1.CarCompareController.updateComparison);
router.delete('/:id', auth_middleware_1.protect, (0, auth_middleware_1.restrictTo)('admin', 'superadmin'), car_compare_controller_1.CarCompareController.deleteComparison);
router.patch('/restore/:id', auth_middleware_1.protect, (0, auth_middleware_1.restrictTo)('admin', 'superadmin'), car_compare_controller_1.CarCompareController.restoreComparison);
exports.default = router;
//# sourceMappingURL=car-compare.routes.js.map