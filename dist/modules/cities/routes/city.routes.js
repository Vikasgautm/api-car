"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const city_controller_1 = require("../controllers/city.controller");
const auth_middleware_1 = require("../../../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.get('/', city_controller_1.CityController.getAllCities);
router.post('/', auth_middleware_1.protect, (0, auth_middleware_1.restrictTo)('admin'), city_controller_1.CityController.createCity);
exports.default = router;
//# sourceMappingURL=city.routes.js.map