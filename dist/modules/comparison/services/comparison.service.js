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
            const car1Id = new mongoose_1.default.Types.ObjectId(data.car1_id);
            const car2Id = new mongoose_1.default.Types.ObjectId(data.car2_id);
            // Validate cars exist
            const [car1, car2] = await Promise.all([
                car_model_1.Car.findById(car1Id),
                car_model_1.Car.findById(car2Id),
            ]);
            if (!car1)
                throw new app_error_util_1.AppError('Car 1 not found', 404);
            if (!car2)
                throw new app_error_util_1.AppError('Car 2 not found', 404);
            if (car1Id.equals(car2Id))
                throw new app_error_util_1.AppError('Cannot compare the same car', 400);
            // Generate unique slug
            let slug = data.slug;
            const existingSlug = await comparison_model_1.Comparison.findOne({ slug });
            if (existingSlug) {
                slug = await (0, slug_util_1.generateSlugWithIncrement)(data.slug, comparison_model_1.Comparison, 'slug');
            }
            // Validate variants if provided
            if (data.variant1_id) {
                const variant1 = await car_variant_model_1.CarVariant.findById(data.variant1_id);
                if (!variant1)
                    throw new app_error_util_1.AppError('Variant 1 not found', 404);
            }
            if (data.variant2_id) {
                const variant2 = await car_variant_model_1.CarVariant.findById(data.variant2_id);
                if (!variant2)
                    throw new app_error_util_1.AppError('Variant 2 not found', 404);
            }
            // Create comparison
            const comparison = new comparison_model_1.Comparison({
                car1_id: car1Id,
                car2_id: car2Id,
                variant1_id: data.variant1_id ? new mongoose_1.default.Types.ObjectId(data.variant1_id) : undefined,
                variant2_id: data.variant2_id ? new mongoose_1.default.Types.ObjectId(data.variant2_id) : undefined,
                slug,
                title: data.title,
                category: data.category,
                description: data.description,
                compareIntroContent: data.compareIntroContent,
                isPopular: data.isPopular || false,
                isTrending: data.isTrending || false,
                showOnHomepage: data.showOnHomepage || false,
                relatedComparisons: data.relatedComparisons?.map(id => new mongoose_1.default.Types.ObjectId(id)) || [],
                seoMetaTitle: data.seoMetaTitle,
                seoMetaDescription: data.seoMetaDescription,
                seoFAQSchema: data.seoFAQSchema,
                status: data.status || 'draft',
                is_published: data.is_published || false,
                created_by: new mongoose_1.default.Types.ObjectId(userId),
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
            return comparison.populate(['car1_id', 'car2_id', 'variant1_id', 'variant2_id']);
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
                updated_by: new mongoose_1.default.Types.ObjectId(userId),
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
            return comparison.populate(['car1_id', 'car2_id', 'variant1_id', 'variant2_id']);
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
            .populate('car1_id', 'brand slug')
            .populate('car2_id', 'brand slug')
            .populate('variant1_id')
            .populate('variant2_id')
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
        const comparison = await comparison_model_1.Comparison.findOne({ slug, is_deleted: false })
            .populate('car1_id')
            .populate('car2_id')
            .populate('variant1_id')
            .populate('variant2_id')
            .populate('relatedComparisons');
        if (!comparison)
            throw new app_error_util_1.AppError('Comparison not found', 404);
        return comparison;
    }
    static async getComparisonById(id) {
        const comparison = await comparison_model_1.Comparison.findById(id)
            .populate('car1_id')
            .populate('car2_id')
            .populate('variant1_id')
            .populate('variant2_id')
            .populate('relatedComparisons');
        if (!comparison)
            throw new app_error_util_1.AppError('Comparison not found', 404);
        return comparison;
    }
    // Rival Management
    static async addRival(primaryCarId, rivalCarId, userId, strength = 50) {
        const session = await mongoose_1.default.startSession();
        session.startTransaction();
        try {
            const pId = new mongoose_1.default.Types.ObjectId(primaryCarId);
            const rId = new mongoose_1.default.Types.ObjectId(rivalCarId);
            if (pId.equals(rId))
                throw new app_error_util_1.AppError('Cannot set car as its own rival', 400);
            // Create both directions
            const [car1, car2] = await Promise.all([
                car_model_1.Car.findById(pId).session(session),
                car_model_1.Car.findById(rId).session(session),
            ]);
            if (!car1 || !car2)
                throw new app_error_util_1.AppError('One or both cars not found', 404);
            await Promise.all([
                comparison_rival_model_1.ComparisonRival.findOneAndUpdate({ primary_car_id: pId, rival_car_id: rId }, {
                    primary_car_id: pId,
                    rival_car_id: rId,
                    relationship_strength: strength,
                    manual_mapping: true,
                }, { upsert: true, session }),
                comparison_rival_model_1.ComparisonRival.findOneAndUpdate({ primary_car_id: rId, rival_car_id: pId }, {
                    primary_car_id: rId,
                    rival_car_id: pId,
                    relationship_strength: strength,
                    manual_mapping: true,
                }, { upsert: true, session }),
            ]);
            await audit_log_model_1.AuditLog.create([{
                    audit_id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    entity_type: 'car',
                    entity_id: pId.toString(),
                    action: 'update',
                    actor_user_id: userId,
                    new_value: { rival_id: rId.toString() },
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
            const pId = new mongoose_1.default.Types.ObjectId(primaryCarId);
            const rId = new mongoose_1.default.Types.ObjectId(rivalCarId);
            await Promise.all([
                comparison_rival_model_1.ComparisonRival.deleteOne({ primary_car_id: pId, rival_car_id: rId }, { session }),
                comparison_rival_model_1.ComparisonRival.deleteOne({ primary_car_id: rId, rival_car_id: pId }, { session }),
            ]);
            await audit_log_model_1.AuditLog.create([{
                    audit_id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    entity_type: 'car',
                    entity_id: pId.toString(),
                    action: 'update',
                    actor_user_id: userId,
                    old_value: { rival_id: rId.toString() },
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
        const cId = new mongoose_1.default.Types.ObjectId(carId);
        return comparison_rival_model_1.ComparisonRival.find({ primary_car_id: cId })
            .populate('rival_car_id', 'brand slug')
            .sort({ relationship_strength: -1 })
            .limit(limit)
            .lean();
    }
    static async getPopularComparisons(category, limit = 10) {
        const query = { is_published: true, is_deleted: false, isPopular: true };
        if (category)
            query.category = category;
        return comparison_model_1.Comparison.find(query)
            .populate('car1_id', 'brand slug')
            .populate('car2_id', 'brand slug')
            .sort({ created_at: -1 })
            .limit(limit)
            .lean();
    }
    static async getTrendingComparisons(limit = 10) {
        return comparison_model_1.Comparison.find({ is_published: true, is_deleted: false, isTrending: true })
            .populate('car1_id', 'brand slug')
            .populate('car2_id', 'brand slug')
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
            .populate('car1_id', 'brand slug image')
            .populate('car2_id', 'brand slug image')
            .sort({ created_at: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();
        return { comparisons, total, page, limit };
    }
}
exports.ComparisonService = ComparisonService;
//# sourceMappingURL=comparison.service.js.map