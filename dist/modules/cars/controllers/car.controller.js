"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CarController = void 0;
const errorMessages_1 = require("../../../constants/errorMessages");
const app_error_util_1 = require("../../../shared/utils/app-error.util");
const audit_util_1 = require("../../../shared/utils/audit.util");
const response_util_1 = require("../../../shared/utils/response.util");
const catchAsync_1 = require("../../../utils/catchAsync");
const create_car_dto_1 = require("../dto/create-car.dto");
const update_car_dto_1 = require("../dto/update-car.dto");
const car_service_1 = require("../services/car.service");
const redirect_service_1 = require("../../redirects/services/redirect.service");
function parseTagIds(input) {
    if (input === undefined || input === null || input === '')
        return undefined;
    if (Array.isArray(input)) {
        return input.map(v => String(v).trim()).filter(Boolean);
    }
    if (typeof input === 'string') {
        const trimmed = input.trim();
        if (!trimmed)
            return [];
        if (trimmed.startsWith('[')) {
            try {
                const parsed = JSON.parse(trimmed);
                if (Array.isArray(parsed))
                    return parsed.map(v => String(v).trim()).filter(Boolean);
            }
            catch {
                // fall through to csv split
            }
        }
        return trimmed.split(',').map(v => v.trim()).filter(Boolean);
    }
    return undefined;
}
class CarController {
    // Public routes
    static getAllPublicCars = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const filterDto = {
            ...req.query,
            is_published: true,
        };
        const result = await car_service_1.CarService.getAllCars(filterDto, false);
        return response_util_1.ResponseUtil.paginated(res, result.cars, result.pagination, 'Cars retrieved successfully');
    });
    static getPublicCarBySlug = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const slug = req.params.slug;
        // Step 1 — consult the standalone Redirect table first. This is the new
        // canonical source of truth; it takes precedence over per-car redirect_to_slug
        // so admins can stage redirects independently of the car entity lifecycle.
        const redirectHit = await redirect_service_1.RedirectService.resolve(`/cars/${slug}`);
        if (redirectHit) {
            redirect_service_1.RedirectService.recordHit(redirectHit.redirect_id);
            res.setHeader('Location', redirectHit.new_url);
            return res.status(Number(redirectHit.type) || 301).json({
                success: false,
                statusCode: Number(redirectHit.type) || 301,
                message: 'This URL has been redirected',
                data: { redirect_to: redirectHit.new_url, type: redirectHit.type },
                timestamp: new Date().toISOString(),
            });
        }
        const result = await car_service_1.CarService.getCarBySlug(slug);
        if (!result) {
            throw new app_error_util_1.AppError(`Car not found for slug: ${slug}`, 404, {
                userMessage: errorMessages_1.USER_MESSAGES.CAR_NOT_FOUND,
                errorCode: errorMessages_1.ERROR_CODES.CAR_NOT_FOUND,
                details: { field: 'slug', reason: 'The car does not exist or has been deleted.' },
            });
        }
        const car = result.car;
        // Step 2 — backward-compat per-car redirect_to_slug. Kept until all callers
        // migrate to the Redirect table; both are written by lifecycle workflows.
        if (car.redirect_to_slug && car.redirect_to_slug !== slug) {
            res.setHeader('Location', `/cars/${car.redirect_to_slug}`);
            return res.status(301).json({
                success: false,
                statusCode: 301,
                message: 'This car has been replaced',
                data: { redirect_to_slug: car.redirect_to_slug },
                timestamp: new Date().toISOString(),
            });
        }
        // Archived / disabled → 410 Gone. Slug is preserved so SEO equity isn't lost,
        // and we still hand the frontend the car body so a graceful "no longer
        // available" page can render with metadata.
        if (car.status === 'archived' || car.status === 'disabled') {
            return res.status(410).json({
                success: false,
                statusCode: 410,
                message: car.status === 'archived' ? 'This car has been archived' : 'This car has been disabled',
                data: { ...result, gone: true, gone_reason: car.status },
                timestamp: new Date().toISOString(),
            });
        }
        // Discontinued → still served (good for SEO) but with a flag the frontend uses
        // to render a "Discontinued model" banner.
        if (car.status === 'discontinued') {
            return response_util_1.ResponseUtil.success(res, { ...result, discontinued: true }, 'Car retrieved (discontinued)');
        }
        return response_util_1.ResponseUtil.success(res, result, 'Car retrieved successfully');
    });
    // Admin routes
    static getAllAdminCars = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const includeDeleted = req.query.include_deleted === 'true';
        const result = await car_service_1.CarService.getAllCars(req.query, includeDeleted);
        return response_util_1.ResponseUtil.paginated(res, result.cars, result.pagination, 'Cars retrieved successfully');
    });
    static getCarDependencies = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const dependencies = await car_service_1.CarService.getDependencies(req.params.id);
        return response_util_1.ResponseUtil.success(res, dependencies, 'Car dependencies retrieved successfully');
    });
    // One-shot maintenance: recompute aggregated variant_count / price range /
    // fuel-type labels for every non-deleted car. Use after deploying the new
    // aggregate fields, or after bulk variant edits, to repopulate cars whose
    // recompute hook never fired.
    static recomputeAggregatesAll = (0, catchAsync_1.catchAsync)(async (_req, res) => {
        const result = await car_service_1.CarService.recomputeAggregatesAll();
        return response_util_1.ResponseUtil.success(res, result, 'Car aggregates recomputed');
    });
    // Per-car recompute. Backs the admin "Recompute from variants" button.
    static recomputeAggregatesForCar = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const aggregates = await car_service_1.CarService.recomputeAggregatesForCar(req.params.id);
        return response_util_1.ResponseUtil.success(res, aggregates, 'Car aggregates recomputed from variants');
    });
    // Refine ambiguous AI intelligence flags using Claude Haiku 4.5.
    // Returns the LLM verdicts + token usage. If no flags are ambiguous, returns
    // a 200 with a "nothing to refine" message and no LLM call is made.
    static refineAiFlagsForCar = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const result = await car_service_1.CarService.refineAiFlagsForCar(req.params.id);
        if (!result) {
            return response_util_1.ResponseUtil.success(res, null, 'All AI flags have high rule-confidence — no LLM refinement needed');
        }
        return response_util_1.ResponseUtil.success(res, result, `Refined ${result.flags_reviewed.length} flag(s) via ${result.model_used}`);
    });
    static promoteToCurrent = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const actor = req.user
            ? { user_id: req.user.user_id, email: req.user.email, role: req.user.role }
            : null;
        const result = await car_service_1.CarService.promoteToCurrent(req.params.id, {
            base_slug: typeof req.body?.base_slug === 'string' ? req.body.base_slug : undefined,
            reason: typeof req.body?.reason === 'string' ? req.body.reason : undefined,
        }, actor);
        return response_util_1.ResponseUtil.success(res, result, 'Car promoted to current generation');
    });
    static getAdminCarById = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const car = await car_service_1.CarService.getCarById(req.params.id);
        if (!car) {
            throw new app_error_util_1.AppError(`Car not found for car_id: ${req.params.id}`, 404, {
                userMessage: errorMessages_1.USER_MESSAGES.CAR_NOT_FOUND,
                errorCode: errorMessages_1.ERROR_CODES.CAR_NOT_FOUND,
                details: {
                    field: 'car_id',
                    reason: 'The car does not exist or has been deleted.',
                },
            });
        }
        return response_util_1.ResponseUtil.success(res, car, "Car retrieved successfully");
    });
    static createCar = (0, catchAsync_1.catchAsync)(async (req, res) => {
        let thumbnailUrl = req.body.thumbnail_url;
        if (req.file) {
            // Handle both local storage (path) and Cloudinary (secure_url)
            const cloudinaryFile = req.file;
            thumbnailUrl = cloudinaryFile.secure_url || req.file.path;
        }
        // Handle gallery images
        let gallery;
        if (req.body.gallery) {
            try {
                gallery = typeof req.body.gallery === 'string'
                    ? JSON.parse(req.body.gallery)
                    : req.body.gallery;
            }
            catch (e) {
                // If parsing fails, use as-is
                gallery = req.body.gallery;
            }
        }
        const createDto = {
            name: req.body.name,
            slug: req.body.slug,
            brand_id: req.body.brand_id,
            body_type_id: req.body.body_type_id,
            fuel_type_id: req.body.fuel_type_id,
            description: req.body.description,
            thumbnail_url: thumbnailUrl,
            thumbnail_alt: req.body.thumbnail_alt,
            gallery: gallery,
            gallery_summary: req.body.gallery_summary,
            status: req.body.status,
            is_upcoming: req.body.is_upcoming,
            is_launched: req.body.is_launched,
            expected_exshowroom_price: req.body.expected_exshowroom_price,
            expected_launch_date: req.body.expected_launch_date,
            exshowroom_price: req.body.exshowroom_price,
            launch_date: req.body.launch_date,
            is_electric: req.body.is_electric,
            is_published: req.body.is_published,
            is_featured: req.body.is_featured,
            is_popular: req.body.is_popular,
            is_recommended: req.body.is_recommended,
            is_latest: req.body.is_latest,
            top_selling: req.body.top_selling,
            tag_ids: parseTagIds(req.body.tag_ids),
            editor_user_id: req.body.editor_user_id,
            seo_owner_user_id: req.body.seo_owner_user_id,
            reviewer_user_id: req.body.reviewer_user_id,
            meta_title: req.body.meta_title,
            meta_description: req.body.meta_description,
            meta_keywords: req.body.meta_keywords,
            og_image: req.body.og_image,
            canonical_url: req.body.canonical_url,
            noindex: req.body.noindex,
            model_family: req.body.model_family,
            generation_start_year: req.body.generation_start_year != null && req.body.generation_start_year !== '' ? Number(req.body.generation_start_year) : req.body.generation_start_year,
            generation_end_year: req.body.generation_end_year != null && req.body.generation_end_year !== '' ? Number(req.body.generation_end_year) : req.body.generation_end_year,
            generation_label: req.body.generation_label,
            is_current: req.body.is_current !== undefined ? req.body.is_current === 'true' || req.body.is_current === true : undefined,
            is_facelift: req.body.is_facelift !== undefined ? req.body.is_facelift === 'true' || req.body.is_facelift === true : undefined,
            predecessor_car_id: req.body.predecessor_car_id,
            successor_car_id: req.body.successor_car_id,
        };
        const validation = create_car_dto_1.CreateCarDto.validate(createDto);
        if (!validation.valid) {
            throw new app_error_util_1.AppError(validation.errors.join(', '), 400);
        }
        const car = await car_service_1.CarService.createCar(createDto, audit_util_1.AuditUtil.actorFromRequest(req));
        return response_util_1.ResponseUtil.created(res, car, "Car created successfully");
    });
    static updateCar = (0, catchAsync_1.catchAsync)(async (req, res) => {
        let thumbnailUrl = req.body.thumbnail_url;
        if (req.file) {
            // Handle both local storage (path) and Cloudinary (secure_url)
            const cloudinaryFile = req.file;
            thumbnailUrl = cloudinaryFile.secure_url || req.file.path;
        }
        // Handle gallery images
        let gallery;
        if (req.body.gallery) {
            try {
                gallery = typeof req.body.gallery === 'string'
                    ? JSON.parse(req.body.gallery)
                    : req.body.gallery;
            }
            catch (e) {
                // If parsing fails, use as-is
                gallery = req.body.gallery;
            }
        }
        const updateDto = {
            name: req.body.name,
            slug: req.body.slug,
            brand_id: req.body.brand_id,
            body_type_id: req.body.body_type_id,
            fuel_type_id: req.body.fuel_type_id,
            short_description: req.body.short_description,
            description: req.body.description,
            thumbnail_url: thumbnailUrl,
            thumbnail_alt: req.body.thumbnail_alt,
            gallery: gallery,
            gallery_summary: req.body.gallery_summary,
            status: req.body.status,
            is_upcoming: req.body.is_upcoming !== undefined ? req.body.is_upcoming === 'true' || req.body.is_upcoming === true : undefined,
            is_launched: req.body.is_launched !== undefined ? req.body.is_launched === 'true' || req.body.is_launched === true : undefined,
            expected_exshowroom_price: req.body.expected_exshowroom_price,
            expected_launch_date: req.body.expected_launch_date,
            exshowroom_price: req.body.exshowroom_price,
            launch_date: req.body.launch_date,
            is_electric: req.body.is_electric !== undefined ? req.body.is_electric === 'true' || req.body.is_electric === true : undefined,
            is_published: req.body.is_published !== undefined ? req.body.is_published === 'true' || req.body.is_published === true : undefined,
            is_featured: req.body.is_featured !== undefined ? req.body.is_featured === 'true' || req.body.is_featured === true : undefined,
            is_popular: req.body.is_popular !== undefined ? req.body.is_popular === 'true' || req.body.is_popular === true : undefined,
            is_recommended: req.body.is_recommended !== undefined ? req.body.is_recommended === 'true' || req.body.is_recommended === true : undefined,
            is_latest: req.body.is_latest !== undefined ? req.body.is_latest === 'true' || req.body.is_latest === true : undefined,
            top_selling: req.body.top_selling !== undefined ? req.body.top_selling === 'true' || req.body.top_selling === true : undefined,
            tag_ids: parseTagIds(req.body.tag_ids),
            editor_user_id: req.body.editor_user_id,
            seo_owner_user_id: req.body.seo_owner_user_id,
            reviewer_user_id: req.body.reviewer_user_id,
            meta_title: req.body.meta_title,
            meta_description: req.body.meta_description,
            meta_keywords: req.body.meta_keywords,
            og_image: req.body.og_image,
            canonical_url: req.body.canonical_url,
            noindex: req.body.noindex,
            model_family: req.body.model_family,
            generation_start_year: req.body.generation_start_year != null && req.body.generation_start_year !== '' ? Number(req.body.generation_start_year) : req.body.generation_start_year,
            generation_end_year: req.body.generation_end_year != null && req.body.generation_end_year !== '' ? Number(req.body.generation_end_year) : req.body.generation_end_year,
            generation_label: req.body.generation_label,
            is_current: req.body.is_current !== undefined ? req.body.is_current === 'true' || req.body.is_current === true : undefined,
            is_facelift: req.body.is_facelift !== undefined ? req.body.is_facelift === 'true' || req.body.is_facelift === true : undefined,
            predecessor_car_id: req.body.predecessor_car_id,
            successor_car_id: req.body.successor_car_id,
        };
        const validation = update_car_dto_1.UpdateCarDto.validate(updateDto);
        if (!validation.valid) {
            throw new app_error_util_1.AppError(validation.errors.join(', '), 400);
        }
        const car = await car_service_1.CarService.updateCar(req.params.id, updateDto, audit_util_1.AuditUtil.actorFromRequest(req));
        return response_util_1.ResponseUtil.success(res, car, "Car updated successfully");
    });
    static deleteCar = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const car = await car_service_1.CarService.deleteCar(req.params.id, audit_util_1.AuditUtil.actorFromRequest(req));
        return response_util_1.ResponseUtil.success(res, car, "Car deleted successfully");
    });
    static restoreCar = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const car = await car_service_1.CarService.restoreCar(req.params.id, audit_util_1.AuditUtil.actorFromRequest(req));
        return response_util_1.ResponseUtil.success(res, car, "Car restored successfully");
    });
    static togglePublish = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const car = await car_service_1.CarService.togglePublish(req.params.id, audit_util_1.AuditUtil.actorFromRequest(req));
        return response_util_1.ResponseUtil.success(res, car, "Car publish status toggled successfully");
    });
    static markLaunched = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const car = await car_service_1.CarService.markLaunched(req.params.id, audit_util_1.AuditUtil.actorFromRequest(req));
        return response_util_1.ResponseUtil.success(res, car, "Car marked as launched successfully");
    });
    static markUpcoming = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const { expected_exshowroom_price, expected_launch_date } = req.body;
        const car = await car_service_1.CarService.markUpcoming(req.params.id, { expected_exshowroom_price, expected_launch_date }, audit_util_1.AuditUtil.actorFromRequest(req));
        return response_util_1.ResponseUtil.success(res, car, "Car marked as upcoming successfully");
    });
}
exports.CarController = CarController;
//# sourceMappingURL=car.controller.js.map