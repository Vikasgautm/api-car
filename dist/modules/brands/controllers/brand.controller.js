"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrandController = void 0;
const error_middleware_1 = require("../../../middlewares/error.middleware");
const catchAsync_1 = require("../../../utils/catchAsync");
const brand_service_1 = require("../services/brand.service");
class BrandController {
    static getAllBrands = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const result = await brand_service_1.BrandService.getAllBrands(req.query);
        res.status(200).json({
            status: "success",
            data: result,
        });
    });
    static getBrandBySlug = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const brand = await brand_service_1.BrandService.getBrandBySlug(req.params.slug);
        if (!brand) {
            throw new error_middleware_1.AppError("Brand not found", 404);
        }
        res.status(200).json({
            status: "success",
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
        const brand = await brand_service_1.BrandService.createBrand({
            ...req.body,
            images,
            // SEO fields
            meta_title: req.body.meta_title,
            meta_description: req.body.meta_description,
            meta_keywords: req.body.meta_keywords,
        });
        res.status(201).json({
            status: "success",
            data: { brand },
        });
    });
    static updateBrand = (0, catchAsync_1.catchAsync)(async (req, res) => {
        let updateData = { ...req.body };
        if (updateData.is_published !== undefined) {
            updateData.is_published = updateData.is_published === "true";
        }
        if (req.files?.["images"]) {
            const file = req.files["images"][0];
            updateData.images = {
                url: file.path,
                title: req.body.title || "",
            };
        }
        // SEO fields
        if (req.body.meta_title !== undefined)
            updateData.meta_title = req.body.meta_title;
        if (req.body.meta_description !== undefined)
            updateData.meta_description = req.body.meta_description;
        if (req.body.meta_keywords !== undefined)
            updateData.meta_keywords = req.body.meta_keywords;
        const brand = await brand_service_1.BrandService.updateBrand(req.params.id, updateData);
        if (!brand)
            throw new error_middleware_1.AppError("Brand not found", 404);
        res.status(200).json({
            status: "success",
            data: { brand },
        });
    });
    static deleteBrand = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const brand = await brand_service_1.BrandService.deleteBrand(req.params.id);
        if (!brand)
            throw new error_middleware_1.AppError("Brand not found", 404);
        res.status(200).json({
            status: "success",
            message: "Brand soft deleted successfully",
        });
    });
    static restoreBrand = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const brand = await brand_service_1.BrandService.restoreBrand(req.params.id);
        if (!brand)
            throw new error_middleware_1.AppError("Brand not found", 404);
        res.status(200).json({
            status: "success",
            message: "Brand restored successfully",
            data: { brand },
        });
    });
}
exports.BrandController = BrandController;
//# sourceMappingURL=brand.controller.js.map