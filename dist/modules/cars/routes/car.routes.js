"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const car_controller_1 = require("../controllers/car.controller");
const auth_middleware_1 = require("../../../middlewares/auth.middleware");
const cloudinary_1 = __importDefault(require("../../../utils/cloudinary"));
const router = (0, express_1.Router)();
router.get('/', car_controller_1.CarController.getAllCars);
router.get('/:slug', car_controller_1.CarController.getCarBySlug);
router.post('/', auth_middleware_1.protect, (0, auth_middleware_1.restrictTo)('admin', 'superadmin'), cloudinary_1.default.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "images", maxCount: 10 },
]), car_controller_1.CarController.createCar);
router.put('/:id', auth_middleware_1.protect, (0, auth_middleware_1.restrictTo)('admin', 'superadmin'), cloudinary_1.default.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "images", maxCount: 10 },
]), car_controller_1.CarController.updateCar);
router.delete('/:id', auth_middleware_1.protect, (0, auth_middleware_1.restrictTo)('admin', 'superadmin'), car_controller_1.CarController.deleteCar);
exports.default = router;
//# sourceMappingURL=car.routes.js.map