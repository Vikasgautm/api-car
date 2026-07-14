"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrandController = void 0;
const validation_1 = require("../../../shared/validation");
const errorMessages_1 = require("../../../constants/errorMessages");
const app_error_util_1 = require("../../../shared/utils/app-error.util");
const response_util_1 = require("../../../shared/utils/response.util");
const catchAsync_1 = require("../../../utils/catchAsync");
const brand_service_1 = require("../services/brand.service");
class BrandController {
    // Public routes
    static getAllPublicBrands = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const filterDto = { ...req.query, is_published: true };
        const result = await brand_service_1.BrandService.getAllBrands(filterDto, false);
        return response_util_1.ResponseUtil.paginated(res, result.brands, result.pagination, 'Brands retrieved successfully');
    });
    static getPublicBrandBySlug = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const brand = await brand_service_1.BrandService.getBrandBySlug(req.params.slug);
        if (!brand) {
            throw new app_error_util_1.AppError(`Brand not found for slug: ${req.params.slug}`, 404, {
                userMessage: errorMessages_1.USER_MESSAGES.BRAND_NOT_FOUND,
                errorCode: errorMessages_1.ERROR_CODES.BRAND_NOT_FOUND,
                details: { field: 'slug', reason: 'The brand does not exist or has been deleted.' },
            });
        }
        return response_util_1.ResponseUtil.success(res, brand, 'Brand retrieved successfully');
    });
    // Admin routes
    static getAllAdminBrands = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const includeDeleted = req.query.include_deleted === 'true';
        const result = await brand_service_1.BrandService.getAllBrands(req.query, includeDeleted);
        return response_util_1.ResponseUtil.paginated(res, result.brands, result.pagination, 'Brands retrieved successfully');
    });
    static getAdminBrandById = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const brand = await brand_service_1.BrandService.getBrandById(req.params.id);
        if (!brand) {
            throw new app_error_util_1.AppError(`Brand not found for brand_id: ${req.params.id}`, 404, {
                userMessage: errorMessages_1.USER_MESSAGES.BRAND_NOT_FOUND,
                errorCode: errorMessages_1.ERROR_CODES.BRAND_NOT_FOUND,
                details: { field: 'brand_id', reason: 'The brand does not exist or has been deleted.' },
            });
        }
        return response_util_1.ResponseUtil.success(res, brand, 'Brand retrieved successfully');
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
        const validation = validation_1.createBrandSchema.safeParse(createDto);
        if (!validation.success) {
            throw new app_error_util_1.AppError(validation.error.errors.map(e => e.message).join(', '), 400);
        }
        const brand = await brand_service_1.BrandService.createBrand({ ...createDto, ...req.body });
        return response_util_1.ResponseUtil.created(res, brand, 'Brand created successfully');
    });
    static updateBrand = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const updateDto = {
            name: req.body.name,
            description: req.body.description,
            logo_url: req.file
                ? req.file.secure_url || req.file.path
                : req.body.logo_url,
            logo_title: req.body.logo_title,
            is_published: req.body.is_published !== undefined
                ? req.body.is_published === 'true' || req.body.is_published === true
                : undefined,
            is_featured: req.body.is_featured !== undefined
                ? req.body.is_featured === 'true' || req.body.is_featured === true
                : undefined,
            meta_title: req.body.meta_title,
            meta_description: req.body.meta_description,
            meta_keywords: req.body.meta_keywords,
            og_image: req.body.og_image,
            canonical_url: req.body.canonical_url,
            noindex: req.body.noindex,
        };
        const validation = validation_1.updateBrandSchema.safeParse(updateDto);
        if (!validation.success) {
            throw new app_error_util_1.AppError(validation.error.errors.map(e => e.message).join(', '), 400, {
                userMessage: errorMessages_1.USER_MESSAGES.VALIDATION_ERROR,
                errorCode: errorMessages_1.ERROR_CODES.VALIDATION_ERROR,
                details: { fields: validation.error.errors.map(e => e.message) },
            });
        }
        const brand = await brand_service_1.BrandService.updateBrand(req.params.id, {
            ...updateDto,
            // Pass through extra fields (alias, short_description, slug, founded_year, etc.)
            alias: req.body.alias,
            slug: req.body.slug,
            short_description: req.body.short_description,
            founded_year: req.body.founded_year,
            country: req.body.country,
            parent_company: req.body.parent_company,
            website: req.body.website,
            brand_media: req.body.brand_media ? JSON.parse(req.body.brand_media) : undefined,
            is_upcoming: req.body.is_upcoming !== undefined
                ? req.body.is_upcoming === 'true' || req.body.is_upcoming === true
                : undefined,
            is_discontinued: req.body.is_discontinued !== undefined
                ? req.body.is_discontinued === 'true' || req.body.is_discontinued === true
                : undefined,
        });
        return response_util_1.ResponseUtil.success(res, brand, 'Brand updated successfully');
    });
    static updateBrandJson = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const brand = await brand_service_1.BrandService.updateBrand(req.params.id, req.body);
        return response_util_1.ResponseUtil.success(res, brand, 'Brand updated successfully');
    });
    static deleteBrand = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const brand = await brand_service_1.BrandService.deleteBrand(req.params.id);
        return response_util_1.ResponseUtil.success(res, brand, 'Brand deleted successfully');
    });
    static restoreBrand = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const brand = await brand_service_1.BrandService.restoreBrand(req.params.id);
        return response_util_1.ResponseUtil.success(res, brand, 'Brand restored successfully');
    });
    static togglePublish = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const brand = await brand_service_1.BrandService.togglePublish(req.params.id);
        return response_util_1.ResponseUtil.success(res, brand, 'Brand publish status toggled successfully');
    });
    static refreshAggregates = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const result = await brand_service_1.BrandService.refreshAggregates(req.params.id);
        return response_util_1.ResponseUtil.success(res, result, 'Brand aggregates refreshed successfully');
    });
    static refreshAllAggregates = (0, catchAsync_1.catchAsync)(async (_req, res) => {
        const result = await brand_service_1.BrandService.refreshAllAggregates();
        return response_util_1.ResponseUtil.success(res, result, `Refreshed aggregates for ${result.processed} brands`);
    });
}
exports.BrandController = BrandController;
