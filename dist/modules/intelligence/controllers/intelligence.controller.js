"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntelligenceController = void 0;
const app_error_util_1 = require("../../../shared/utils/app-error.util");
const response_util_1 = require("../../../shared/utils/response.util");
const catchAsync_1 = require("../../../utils/catchAsync");
const intelligence_service_1 = require("../services/intelligence.service");
const upsert_override_dto_1 = require("../dto/upsert-override.dto");
function parseFuelCategory(input) {
    if (input !== 'ice' && input !== 'ev') {
        throw new app_error_util_1.AppError(`fuel_category must be 'ice' or 'ev' (got: ${String(input)})`, 400);
    }
    return input;
}
class IntelligenceController {
    static getBenchmarkMatrix = (0, catchAsync_1.catchAsync)(async (_req, res) => {
        const rows = await intelligence_service_1.IntelligenceService.getBenchmarkMatrix();
        return response_util_1.ResponseUtil.success(res, rows, 'Mileage benchmark matrix retrieved successfully');
    });
    static upsertOverride = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const fuel = parseFuelCategory(req.params.fuel_category);
        const dto = {
            weak_max: Number(req.body.weak_max),
            average_max: Number(req.body.average_max),
            good_max: Number(req.body.good_max),
        };
        const validation = upsert_override_dto_1.UpsertBenchmarkOverrideDto.validate(dto);
        if (!validation.success) {
            throw new app_error_util_1.AppError(validation.error.errors.map((e) => e.message).join(', '), 400);
        }
        const updated = await intelligence_service_1.IntelligenceService.upsertOverride(req.params.body_type_id, fuel, {
            weak_max: dto.weak_max,
            average_max: dto.average_max,
            good_max: dto.good_max,
        }, req.user?.user_id);
        return response_util_1.ResponseUtil.success(res, updated, 'Benchmark override saved');
    });
    static deleteOverride = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const fuel = parseFuelCategory(req.params.fuel_category);
        const removed = await intelligence_service_1.IntelligenceService.deleteOverride(req.params.body_type_id, fuel);
        if (!removed) {
            throw new app_error_util_1.AppError('No override existed for this body type and fuel category', 404);
        }
        return response_util_1.ResponseUtil.success(res, { reset: true }, 'Override removed; default thresholds restored');
    });
    static reclassifyAll = (0, catchAsync_1.catchAsync)(async (_req, res) => {
        const counts = await intelligence_service_1.IntelligenceService.reclassifyAll();
        return response_util_1.ResponseUtil.success(res, counts, `Reclassified ${counts.variants} variant(s) across ${counts.cars} car(s)`);
    });
}
exports.IntelligenceController = IntelligenceController;
