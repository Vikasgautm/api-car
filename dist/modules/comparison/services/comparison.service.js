"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComparisonService = void 0;
const comparison_model_1 = require("../../../models/comparison.model");
const comparison_rival_model_1 = require("../../../models/comparison-rival.model");
const car_model_1 = require("../../../models/car.model");
const car_variant_model_1 = require("../../../models/car-variant.model");
const audit_log_model_1 = require("../../../models/audit-log.model");
const app_error_util_1 = require("../../../shared/utils/app-error.util");
const slug_util_1 = require("../../../shared/utils/slug.util");
const mongoose_1 = __importDefault(require("mongoose"));
class ComparisonService {
    static async createComparison(data, userId) {
        const session = await mongoose_1.default.startSession();
        session.startTransaction();
        try {
            // Validate cars exist — DTO sends MongoDB _id (24-char ObjectId)
            const [car1, car2] = await Promise.all([
                car_model_1.Car.findById(data.car1_id),
                car_model_1.Car.findById(data.car2_id),
            ]);
            if (!car1)
                throw new app_error_util_1.AppError('Car 1 not found', 404);
            if (!car2)
                throw new app_error_util_1.AppError('Car 2 not found', 404);
            if (data.car1_id === data.car2_id)
                throw new app_error_util_1.AppError('Cannot compare the same car', 400);
            // Generate unique slug
            let slug = data.slug;
            const existingSlug = await comparison_model_1.Comparison.findOne({ slug });
            if (existingSlug) {
                slug = await (0, slug_util_1.generateSlugWithIncrement)(data.slug, comparison_model_1.Comparison, 'slug');
            }
            // Validate variants if provided
            if (data.variant1_id) {
                const variant1 = await car_variant_model_1.CarVariant.findOne({ variant_id: data.variant1_id });
                if (!variant1)
                    throw new app_error_util_1.AppError('Variant 1 not found', 404);
            }
            if (data.variant2_id) {
                const variant2 = await car_variant_model_1.CarVariant.findOne({ variant_id: data.variant2_id });
                if (!variant2)
                    throw new app_error_util_1.AppError('Variant 2 not found', 404);
            }
            // Create comparison
            const comparison = new comparison_model_1.Comparison({
                car1_id: data.car1_id,
                car2_id: data.car2_id,
                variant1_id: data.variant1_id,
                variant2_id: data.variant2_id,
                slug,
                title: data.title,
                category: data.category,
                description: data.description,
                compareIntroContent: data.compareIntroContent,
                isPopular: data.isPopular || false,
                isTrending: data.isTrending || false,
                showOnHomepage: data.showOnHomepage || false,
                relatedComparisons: data.relatedComparisons || [],
                seoMetaTitle: data.seoMetaTitle,
                seoMetaDescription: data.seoMetaDescription,
                seoFAQSchema: data.seoFAQSchema,
                status: data.status || 'draft',
                is_published: data.is_published || false,
                created_by: userId,
            });
            await comparison.save({ session });
            // Log audit
            await audit_log_model_1.AuditLog.create([{
                    audit_id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    entity_type: 'comparison',
                    entity_id: comparison._id.toString(),
                    action: 'create',
                    actor_user_id: userId,
                    new_value: { slug, title: data.title },
                }], { session });
            await session.commitTransaction();
            return comparison;
        }
        catch (error) {
            await session.abortTransaction();
            throw error;
        }
        finally {
            session.endSession();
        }
    }
    static async updateComparison(comparisonId, data, userId) {
        const session = await mongoose_1.default.startSession();
        session.startTransaction();
        try {
            const comparison = await comparison_model_1.Comparison.findById(comparisonId).session(session);
            if (!comparison)
                throw new app_error_util_1.AppError('Comparison not found', 404);
            // Check slug uniqueness if being changed
            if (data.slug && data.slug !== comparison.slug) {
                const existingSlug = await comparison_model_1.Comparison.findOne({ slug: data.slug }).session(session);
                if (existingSlug) {
                    data.slug = await (0, slug_util_1.generateSlugWithIncrement)(data.slug, comparison_model_1.Comparison, 'slug');
                }
            }
            Object.assign(comparison, {
                ...data,
                updated_by: userId,
            });
            await comparison.save({ session });
            await audit_log_model_1.AuditLog.create([{
                    audit_id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    entity_type: 'comparison',
                    entity_id: comparison._id.toString(),
                    action: 'update',
                    actor_user_id: userId,
                    new_value: data,
                }], { session });
            await session.commitTransaction();
            return comparison;
        }
        catch (error) {
            await session.abortTransaction();
            throw error;
        }
        finally {
            session.endSession();
        }
    }
    static async deleteComparison(comparisonId, userId) {
        const session = await mongoose_1.default.startSession();
        session.startTransaction();
        try {
            const comparison = await comparison_model_1.Comparison.findByIdAndUpdate(comparisonId, {
                is_deleted: true,
                deleted_at: new Date(),
                status: 'archived',
            }, { new: true, session });
            if (!comparison)
                throw new app_error_util_1.AppError('Comparison not found', 404);
            await audit_log_model_1.AuditLog.create([{
                    audit_id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    entity_type: 'comparison',
                    entity_id: comparison._id.toString(),
                    action: 'delete',
                    actor_user_id: userId,
                    new_value: { slug: comparison.slug },
                }], { session });
            await session.commitTransaction();
        }
        catch (error) {
            await session.abortTransaction();
            throw error;
        }
        finally {
            session.endSession();
        }
    }
    static async restoreComparison(comparisonId, userId) {
        const session = await mongoose_1.default.startSession();
        session.startTransaction();
        try {
            const comparison = await comparison_model_1.Comparison.findByIdAndUpdate(comparisonId, {
                is_deleted: false,
                deleted_at: null,
                status: 'draft',
            }, { new: true, session });
            if (!comparison)
                throw new app_error_util_1.AppError('Comparison not found', 404);
            await audit_log_model_1.AuditLog.create([{
                    audit_id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    entity_type: 'comparison',
                    entity_id: comparison._id.toString(),
                    action: 'restore',
                    actor_user_id: userId,
                    new_value: { slug: comparison.slug },
                }], { session });
            await session.commitTransaction();
            return comparison;
        }
        catch (error) {
            await session.abortTransaction();
            throw error;
        }
        finally {
            session.endSession();
        }
    }
    static async getComparisons(page = 1, limit = 10, filter = {}) {
        const query = { is_deleted: filter.is_deleted || false };
        if (filter.search) {
            query.$or = [
                { title: { $regex: filter.search, $options: 'i' } },
                { slug: { $regex: filter.search, $options: 'i' } },
            ];
        }
        if (filter.category)
            query.category = filter.category;
        if (filter.status)
            query.status = filter.status;
        if (filter.isPopular !== undefined)
            query.isPopular = filter.isPopular;
        if (filter.isTrending !== undefined)
            query.isTrending = filter.isTrending;
        const total = await comparison_model_1.Comparison.countDocuments(query);
        const comparisons = await comparison_model_1.Comparison.find(query)
            .sort({ created_at: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();
        return {
            comparisons,
            total,
            page,
            limit,
            pages: Math.ceil(total / limit),
        };
    }
    static async getComparisonBySlug(slug) {
        const comparison = await comparison_model_1.Comparison.findOne({ slug, is_deleted: false });
        if (!comparison)
            throw new app_error_util_1.AppError('Comparison not found', 404);
        return comparison;
    }
    static async getComparisonById(id) {
        const comparison = await comparison_model_1.Comparison.findById(id);
        if (!comparison)
            throw new app_error_util_1.AppError('Comparison not found', 404);
        return comparison;
    }
    // Rival Management
    static async addRival(primaryCarId, rivalCarId, userId, strength = 50) {
        const session = await mongoose_1.default.startSession();
        session.startTransaction();
        try {
            if (primaryCarId === rivalCarId)
                throw new app_error_util_1.AppError('Cannot set car as its own rival', 400);
            // Create both directions
            const [car1, car2] = await Promise.all([
                car_model_1.Car.findById(primaryCarId).session(session),
                car_model_1.Car.findById(rivalCarId).session(session),
            ]);
            if (!car1 || !car2)
                throw new app_error_util_1.AppError('One or both cars not found', 404);
            await Promise.all([
                comparison_rival_model_1.ComparisonRival.findOneAndUpdate({ primary_car_id: primaryCarId, rival_car_id: rivalCarId }, {
                    primary_car_id: primaryCarId,
                    rival_car_id: rivalCarId,
                    relationship_strength: strength,
                    manual_mapping: true,
                }, { upsert: true, session }),
                comparison_rival_model_1.ComparisonRival.findOneAndUpdate({ primary_car_id: rivalCarId, rival_car_id: primaryCarId }, {
                    primary_car_id: rivalCarId,
                    rival_car_id: primaryCarId,
                    relationship_strength: strength,
                    manual_mapping: true,
                }, { upsert: true, session }),
            ]);
            await audit_log_model_1.AuditLog.create([{
                    audit_id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    entity_type: 'car',
                    entity_id: primaryCarId,
                    action: 'update',
                    actor_user_id: userId,
                    new_value: { rival_id: rivalCarId },
                }], { session });
            await session.commitTransaction();
        }
        catch (error) {
            await session.abortTransaction();
            throw error;
        }
        finally {
            session.endSession();
        }
    }
    static async removeRival(primaryCarId, rivalCarId, userId) {
        const session = await mongoose_1.default.startSession();
        session.startTransaction();
        try {
            await Promise.all([
                comparison_rival_model_1.ComparisonRival.deleteOne({ primary_car_id: primaryCarId, rival_car_id: rivalCarId }, { session }),
                comparison_rival_model_1.ComparisonRival.deleteOne({ primary_car_id: rivalCarId, rival_car_id: primaryCarId }, { session }),
            ]);
            await audit_log_model_1.AuditLog.create([{
                    audit_id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    entity_type: 'car',
                    entity_id: primaryCarId,
                    action: 'update',
                    actor_user_id: userId,
                    old_value: { rival_id: rivalCarId },
                }], { session });
            await session.commitTransaction();
        }
        catch (error) {
            await session.abortTransaction();
            throw error;
        }
        finally {
            session.endSession();
        }
    }
    static async getRivals(carId, limit = 10) {
        return comparison_rival_model_1.ComparisonRival.find({ primary_car_id: carId })
            .sort({ relationship_strength: -1 })
            .limit(limit)
            .lean();
    }
    static async getPopularComparisons(category, limit = 10) {
        const query = { is_published: true, is_deleted: false, isPopular: true };
        if (category)
            query.category = category;
        return comparison_model_1.Comparison.find(query)
            .sort({ created_at: -1 })
            .limit(limit)
            .lean();
    }
    static async getTrendingComparisons(limit = 10) {
        return comparison_model_1.Comparison.find({ is_published: true, is_deleted: false, isTrending: true })
            .sort({ updated_at: -1 })
            .limit(limit)
            .lean();
    }
    static async getComparisonsByCategory(category, page = 1, limit = 10) {
        const total = await comparison_model_1.Comparison.countDocuments({
            category,
            is_published: true,
            is_deleted: false,
        });
        const comparisons = await comparison_model_1.Comparison.find({
            category,
            is_published: true,
            is_deleted: false,
        })
            .sort({ created_at: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();
        return { comparisons, total, page, limit };
    }
}
exports.ComparisonService = ComparisonService;
//# sourceMappingURL=comparison.service.js.map