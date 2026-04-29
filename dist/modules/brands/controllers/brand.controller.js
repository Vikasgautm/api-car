"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrandController = void 0;
const app_error_util_1 = require("../../../shared/utils/app-error.util");
const response_util_1 = require("../../../shared/utils/response.util");
const catchAsync_1 = require("../../../utils/catchAsync");
const create_brand_dto_1 = require("../dto/create-brand.dto");
const update_brand_dto_1 = require("../dto/update-brand.dto");
const brand_service_1 = require("../services/brand.service");
class BrandController {
    // Public routes
    static getAllPublicBrands = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const filterDto = {
            ...req.query,
            is_published: true,
        };
        const result = await brand_service_1.BrandService.getAllBrands(filterDto, false);
        return response_util_1.ResponseUtil.paginated(res, result.brands, result.pagination, 'Brands retrieved successfully');
    });
    static getPublicBrandBySlug = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const brand = await brand_service_1.BrandService.getBrandBySlug(req.params.slug);
        if (!brand) {
            throw new app_error_util_1.AppError("Brand not found", 404);
        }
        return response_util_1.ResponseUtil.success(res, brand, "Brand retrieved successfully");
    });
    // Admin routes
    static getAllAdminBrands = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const result = await brand_service_1.BrandService.getAllBrands(req.query, true);
        return response_util_1.ResponseUtil.paginated(res, result.brands, result.pagination, 'Brands retrieved successfully');
    });
    static getAdminBrandById = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const brand = await brand_service_1.BrandService.getBrandById(req.params.id);
        if (!brand) {
            throw new app_error_util_1.AppError("Brand not found", 404);
        }
        return response_util_1.ResponseUtil.success(res, brand, "Brand retrieved successfully");
    });
    static createBrand = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const createDto = {
            name: req.body.name,
            description: req.body.description,
            logo_url: req.file
                ? req.file.secure_url || req.file.path
                : req.body.logo_url,
            logo_title: req.body.logo_title,
            is_published: req.body.is_published,
            is_featured: req.body.is_featured,
            meta_title: req.body.meta_title,
            meta_description: req.body.meta_description,
            meta_keywords: req.body.meta_keywords,
            og_image: req.body.og_image,
            canonical_url: req.body.canonical_url,
            noindex: req.body.noindex,
        };
        const validation = create_brand_dto_1.CreateBrandDto.validate(createDto);
        if (!validation.valid) {
            throw new app_error_util_1.AppError(validation.errors.join(', '), 400);
        }
        const brand = await brand_service_1.BrandService.createBrand(createDto);
        return response_util_1.ResponseUtil.created(res, brand, "Brand created successfully");
    });
    static updateBrand = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const updateDto = {
            name: req.body.name,
            description: req.body.description,
            logo_url: req.file
                ? req.file.secure_url || req.file.path
                : req.body.logo_url,
            logo_title: req.body.logo_title,
            is_published: req.body.is_published !== undefined ? req.body.is_published === 'true' || req.body.is_published === true : undefined,
            is_featured: req.body.is_featured !== undefined ? req.body.is_featured === 'true' || req.body.is_featured === true : undefined,
            meta_title: req.body.meta_title,
            meta_description: req.body.meta_description,
            meta_keywords: req.body.meta_keywords,
            og_image: req.body.og_image,
            canonical_url: req.body.canonical_url,
            noindex: req.body.noindex,
        };
        const validation = update_brand_dto_1.UpdateBrandDto.validate(updateDto);
        if (!validation.valid) {
            throw new app_error_util_1.AppError(validation.errors.join(', '), 400);
        }
        const brand = await brand_service_1.BrandService.updateBrand(req.params.id, updateDto);
        return response_util_1.ResponseUtil.success(res, brand, "Brand updated successfully");
    });
    static deleteBrand = (0, catchAsync_1.catchAsync)(async (req, res) => {
        await brand_service_1.BrandService.deleteBrand(req.params.id);
        return response_util_1.ResponseUtil.success(res, null, "Brand deleted successfully");
    });
    static restoreBrand = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const brand = await brand_service_1.BrandService.restoreBrand(req.params.id);
        return response_util_1.ResponseUtil.success(res, brand, "Brand restored successfully");
    });
    static togglePublish = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const brand = await brand_service_1.BrandService.togglePublish(req.params.id);
        return response_util_1.ResponseUtil.success(res, brand, "Brand publish status toggled successfully");
    });
}
exports.BrandController = BrandController;
//# sourceMappingURL=brand.controller.js.map