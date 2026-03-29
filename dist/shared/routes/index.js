"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_routes_1 = __importDefault(require("../../modules/auth/routes/auth.routes"));
const car_routes_1 = __importDefault(require("../../modules/cars/routes/car.routes"));
const brand_routes_1 = __importDefault(require("../../modules/brands/routes/brand.routes"));
const blog_routes_1 = __importDefault(require("../../modules/blogs/routes/blog.routes"));
const city_routes_1 = __importDefault(require("../../modules/cities/routes/city.routes"));
const faq_routes_1 = __importDefault(require("../../modules/faqs/routes/faq.routes"));
const image_routes_1 = __importDefault(require("../../modules/images/routes/image.routes"));
const car_compare_routes_1 = __importDefault(require("../../modules/carCompare/routes/car-compare.routes"));
const user_routes_1 = __importDefault(require("../../modules/users/routes/user.routes"));
const settings_routes_1 = __importDefault(require("../../modules/settings/routes/settings.routes"));
const router = (0, express_1.Router)();
router.use('/auth', auth_routes_1.default);
router.use('/cars', car_routes_1.default);
router.use('/brands', brand_routes_1.default);
router.use('/blogs', blog_routes_1.default);
router.use('/cities', city_routes_1.default);
router.use('/faqs', faq_routes_1.default);
router.use('/images', image_routes_1.default);
router.use('/car-compare', car_compare_routes_1.default);
router.use('/users', user_routes_1.default);
router.use('/settings', settings_routes_1.default);
exports.default = router;
//# sourceMappingURL=index.js.map