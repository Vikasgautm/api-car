"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrandController = void 0;
const brand_service_1 = require("../services/brand.service");
const catchAsync_1 = require("../../../utils/catchAsync");
const error_middleware_1 = require("../../../middlewares/error.middleware");
class BrandController {
    static getAllBrands = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const result = await brand_service_1.BrandService.getAllBrands(req.query);
        res.status(200).json({
            status: 'success',
            data: result,
        });
    });
    static getBrandBySlug = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const brand = await brand_service_1.BrandService.getBrandBySlug(req.params.slug);
        if (!brand) {
            throw new error_middleware_1.AppError('Brand not found', 404);
        }
        res.status(200).json({
            status: 'success',
            data: { brand },
        });
    });
    static createBrand = (0, catchAsync_1.catchAsync)(async (req, res) => {
        let images = {
            url: "",
            title: req.body.title || "",
            // preview: ""
        };
        if (req.files?.["images"]) {
            const file = req.files["images"][0];
            images.url = file.path;
        }
        const brand = await brand_service_1.BrandService.createBrand({ ...req.body, images });
        res.status(201).json({
            status: 'success',
            data: { brand },
        });
    });
}
exports.BrandController = BrandController;
//# sourceMappingURL=brand.controller.js.map