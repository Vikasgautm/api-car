"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const car_compare_controller_1 = require("../controllers/car-compare.controller");
const auth_middleware_1 = require("../../../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.get('/', car_compare_controller_1.CarCompareController.getAllComparisons);
router.get('/:route', car_compare_controller_1.CarCompareController.getComparisonByRoute);
router.post('/', auth_middleware_1.protect, (0, auth_middleware_1.restrictTo)('admin'), car_compare_controller_1.CarCompareController.createComparison);
exports.default = router;
//# sourceMappingURL=car-compare.routes.js.map