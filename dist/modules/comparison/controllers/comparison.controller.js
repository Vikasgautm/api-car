"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComparisonController = void 0;
const comparison_service_1 = require("../services/comparison.service");
const comparison_dto_1 = require("../../../shared/dto/comparison.dto");
function getQueryString(value) {
    if (Array.isArray(value))
        return value[0];
    if (typeof value === 'string')
        return value;
    return undefined;
}
function getQueryValue(value) {
    if (Array.isArray(value))
        return value[0];
    return value;
}
class ComparisonController {
    static async createComparison(req, res, next) {
        try {
            const data = comparison_dto_1.CreateComparisonDTO.parse(req.body);
            const userId = req.user?.id || req.user?.user_id || '';
            const comparison = await comparison_service_1.ComparisonService.createComparison(data, userId);
            res.status(201).json({
                success: true,
                data: comparison,
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async updateComparison(req, res, next) {
        try {
            const id = getQueryString(req.params.id) || '';
            const data = comparison_dto_1.UpdateComparisonDTO.parse(req.body);
            const userId = req.user?.id || req.user?.user_id || '';
            const comparison = await comparison_service_1.ComparisonService.updateComparison(id, data, userId);
            res.json({
                success: true,
                data: comparison,
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async deleteComparison(req, res, next) {
        try {
            const id = getQueryString(req.params.id) || '';
            const userId = req.user?.id || req.user?.user_id || '';
            await comparison_service_1.ComparisonService.deleteComparison(id, userId);
            res.json({
                success: true,
                message: 'Comparison deleted successfully',
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async restoreComparison(req, res, next) {
        try {
            const id = getQueryString(req.params.id) || '';
            const userId = req.user?.id || req.user?.user_id || '';
            const comparison = await comparison_service_1.ComparisonService.restoreComparison(id, userId);
            res.json({
                success: true,
                data: comparison,
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async getComparisons(req, res, next) {
        try {
            const queryObj = {
                page: getQueryValue(req.query.page),
                limit: getQueryValue(req.query.limit),
                search: getQueryString(req.query.search),
                category: getQueryString(req.query.category),
                status: getQueryString(req.query.status),
                isPopular: getQueryValue(req.query.isPopular),
                isTrending: getQueryValue(req.query.isTrending),
                is_deleted: getQueryValue(req.query.is_deleted),
            };
            const query = comparison_dto_1.ComparisonQueryDTO.parse(queryObj);
            const { page, limit, ...filters } = query;
            const result = await comparison_service_1.ComparisonService.getComparisons(page, limit, filters);
            res.json({
                success: true,
                data: result.comparisons,
                pagination: {
                    total: result.total,
                    page: result.page,
                    limit: result.limit,
                    pages: result.pages,
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async getComparisonById(req, res, next) {
        try {
            const id = getQueryString(req.params.id) || '';
            const comparison = await comparison_service_1.ComparisonService.getComparisonById(id);
            res.json({
                success: true,
                data: comparison,
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async getComparisonBySlug(req, res, next) {
        try {
            const slug = getQueryString(req.params.slug) || '';
            const comparison = await comparison_service_1.ComparisonService.getComparisonBySlug(slug);
            res.json({
                success: true,
                data: comparison,
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async addRival(req, res, next) {
        try {
            const data = comparison_dto_1.CreateRivalDTO.parse(req.body);
            const userId = req.user?.id || req.user?.user_id || '';
            const strength = req.body.relationship_strength || 50;
            await comparison_service_1.ComparisonService.addRival(data.primary_car_id, data.rival_car_id, userId, strength);
            res.status(201).json({
                success: true,
                message: 'Rival added successfully',
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async removeRival(req, res, next) {
        try {
            const car_id = getQueryString(req.params.car_id) || '';
            const rival_id = getQueryString(req.params.rival_id) || '';
            const userId = req.user?.id || req.user?.user_id || '';
            await comparison_service_1.ComparisonService.removeRival(car_id, rival_id, userId);
            res.json({
                success: true,
                message: 'Rival removed successfully',
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async getRivals(req, res, next) {
        try {
            const car_id = getQueryString(req.params.car_id) || '';
            const limit = Number(getQueryString(req.query.limit)) || 10;
            const rivals = await comparison_service_1.ComparisonService.getRivals(car_id, limit);
            res.json({
                success: true,
                data: rivals,
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async getPopularComparisons(req, res, next) {
        try {
            const category = getQueryString(req.query.category);
            const limit = Number(getQueryString(req.query.limit)) || 10;
            const comparisons = await comparison_service_1.ComparisonService.getPopularComparisons(category, limit);
            res.json({
                success: true,
                data: comparisons,
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async getTrendingComparisons(req, res, next) {
        try {
            const limit = Number(getQueryString(req.query.limit)) || 10;
            const comparisons = await comparison_service_1.ComparisonService.getTrendingComparisons(limit);
            res.json({
                success: true,
                data: comparisons,
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async getComparisonsByCategory(req, res, next) {
        try {
            const category = getQueryString(req.params.category) || '';
            const page = Number(getQueryString(req.query.page)) || 1;
            const limit = Number(getQueryString(req.query.limit)) || 10;
            const result = await comparison_service_1.ComparisonService.getComparisonsByCategory(category, page, limit);
            res.json({
                success: true,
                data: result.comparisons,
                pagination: {
                    total: result.total,
                    page: page,
                    limit: limit,
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.ComparisonController = ComparisonController;
//# sourceMappingURL=comparison.controller.js.map