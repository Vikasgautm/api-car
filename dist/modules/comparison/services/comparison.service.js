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
// Accept either UUID (car_id, the cross-app canonical key) or MongoDB _id.
// Old payloads sent _id; rest of the codebase uses car_id, so be tolerant.
async function findCarByEitherId(id) {
    if (!id)
        return null;
    let car = await car_model_1.Car.findOne({ car_id: id, is_deleted: false });
    if (car)
        return car;
    if (mongoose_1.default.Types.ObjectId.isValid(id) && id.length === 24) {
        car = await car_model_1.Car.findById(id);
    }
    return car;
}
function safeStartTransaction(session) {
    try {
        const conn = mongoose_1.default.connection;
        const topologyType = conn.client?.topology?.description?.type;
        if (topologyType === 'Single') {
            // Standalone MongoDB doesn't support transactions
            return;
        }
        session.startTransaction();
    }
    catch (err) {
        // standalone MongoDB support
    }
}
class ComparisonService {
    static async createComparison(data, userId) {
        const session = await mongoose_1.default.startSession();
        safeStartTransaction(session);
        try {
            const [car1, car2] = await Promise.all([
                findCarByEitherId(data.car1_id),
                findCarByEitherId(data.car2_id),
            ]);
            if (!car1)
                throw new app_error_util_1.AppError(`Car 1 not found (id: ${data.car1_id})`, 404, { errorCode: 'CAR_NOT_FOUND' });
            if (!car2)
                throw new app_error_util_1.AppError(`Car 2 not found (id: ${data.car2_id})`, 404, { errorCode: 'CAR_NOT_FOUND' });
            if (data.car1_id === data.car2_id)
                throw new app_error_util_1.AppError('Cannot compare the same car', 400, { errorCode: 'INVALID_INPUT' });
            // Generate unique slug
            let slug = data.slug;
            const existingSlug = await comparison_model_1.Comparison.findOne({ slug });
            if (existingSlug) {
                throw new app_error_util_1.AppError('Comparison with this slug already exists', 409, { errorCode: 'SLUG_ALREADY_EXISTS' });
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
            await comparison.save(session.inTransaction() ? { session } : {});
            // Log audit
            await audit_log_model_1.AuditLog.create([{
                    audit_id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    entity_type: 'comparison',
                    entity_id: comparison._id.toString(),
                    action: 'create',
                    actor_user_id: userId,
                    new_value: { slug, title: data.title },
                }], session.inTransaction() ? { session } : {});
            if (session.inTransaction()) {
                await session.commitTransaction();
            }
            return comparison;
        }
        catch (error) {
            if (session.inTransaction()) {
                await session.abortTransaction();
            }
            throw error;
        }
        finally {
            session.endSession();
        }
    }
    static async updateComparison(comparisonId, data, userId) {
        const session = await mongoose_1.default.startSession();
        safeStartTransaction(session);
        try {
            const comparison = await comparison_model_1.Comparison.findOne({ comparison_id: comparisonId, is_deleted: false }).session(session.inTransaction() ? session : null);
            if (!comparison)
                throw new app_error_util_1.AppError('Comparison not found', 404);
            // Check slug uniqueness if being changed
            if (data.slug && data.slug !== comparison.slug) {
                const existingSlug = await comparison_model_1.Comparison.findOne({ slug: data.slug }).session(session.inTransaction() ? session : null);
                if (existingSlug) {
                    data.slug = await (0, slug_util_1.generateSlugWithIncrement)(data.slug, comparison_model_1.Comparison, 'slug');
                }
            }
            Object.assign(comparison, {
                ...data,
                updated_by: userId,
            });
            await comparison.save(session.inTransaction() ? { session } : {});
            await audit_log_model_1.AuditLog.create([{
                    audit_id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    entity_type: 'comparison',
                    entity_id: comparison._id.toString(),
                    action: 'update',
                    actor_user_id: userId,
                    new_value: data,
                }], session.inTransaction() ? { session } : {});
            if (session.inTransaction()) {
                await session.commitTransaction();
            }
            return comparison;
        }
        catch (error) {
            if (session.inTransaction()) {
                await session.abortTransaction();
            }
            throw error;
        }
        finally {
            session.endSession();
        }
    }
    static async deleteComparison(comparisonId, userId) {
        const session = await mongoose_1.default.startSession();
        safeStartTransaction(session);
        try {
            const query = { is_deleted: false };
            if (mongoose_1.default.Types.ObjectId.isValid(comparisonId) && comparisonId.length === 24) {
                query.$or = [{ comparison_id: comparisonId }, { _id: comparisonId }];
            }
            else {
                query.comparison_id = comparisonId;
            }
            const comparison = await comparison_model_1.Comparison.findOneAndUpdate(query, {
                is_deleted: true,
                deleted_at: new Date(),
                status: 'archived',
            }, session.inTransaction() ? { new: true, session } : { new: true });
            if (!comparison)
                throw new app_error_util_1.AppError('Comparison not found', 404);
            await audit_log_model_1.AuditLog.create([{
                    audit_id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    entity_type: 'comparison',
                    entity_id: comparison._id.toString(),
                    action: 'delete',
                    actor_user_id: userId,
                    new_value: { slug: comparison.slug },
                }], session.inTransaction() ? { session } : {});
            if (session.inTransaction()) {
                await session.commitTransaction();
            }
        }
        catch (error) {
            if (session.inTransaction()) {
                await session.abortTransaction();
            }
            throw error;
        }
        finally {
            session.endSession();
        }
    }
    static async restoreComparison(comparisonId, userId) {
        const session = await mongoose_1.default.startSession();
        safeStartTransaction(session);
        try {
            const query = { is_deleted: true };
            if (mongoose_1.default.Types.ObjectId.isValid(comparisonId) && comparisonId.length === 24) {
                query.$or = [{ comparison_id: comparisonId }, { _id: comparisonId }];
            }
            else {
                query.comparison_id = comparisonId;
            }
            const comparison = await comparison_model_1.Comparison.findOneAndUpdate(query, {
                is_deleted: false,
                deleted_at: null,
                status: 'draft',
            }, session.inTransaction() ? { new: true, session } : { new: true });
            if (!comparison)
                throw new app_error_util_1.AppError('Comparison not found', 404);
            await audit_log_model_1.AuditLog.create([{
                    audit_id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    entity_type: 'comparison',
                    entity_id: comparison._id.toString(),
                    action: 'restore',
                    actor_user_id: userId,
                    new_value: { slug: comparison.slug },
                }], session.inTransaction() ? { session } : {});
            if (session.inTransaction()) {
                await session.commitTransaction();
            }
            return comparison;
        }
        catch (error) {
            if (session.inTransaction()) {
                await session.abortTransaction();
            }
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
        const comparison = await comparison_model_1.Comparison.findOne({ slug, is_deleted: false }).lean();
        if (!comparison)
            throw new app_error_util_1.AppError('Comparison not found', 404);
        // Fetch compared cars in parallel
        const [car1, car2] = await Promise.all([
            car_model_1.Car.findOne({ car_id: comparison.car1_id, is_deleted: false }).lean(),
            car_model_1.Car.findOne({ car_id: comparison.car2_id, is_deleted: false }).lean(),
        ]);
        return {
            ...comparison,
            car1_id: car1 || comparison.car1_id,
            car2_id: car2 || comparison.car2_id,
        };
    }
    static async getComparisonById(id) {
        const query = { is_deleted: false };
        if (mongoose_1.default.Types.ObjectId.isValid(id) && id.length === 24) {
            query.$or = [{ comparison_id: id }, { _id: id }];
        }
        else {
            query.comparison_id = id;
        }
        const comparison = await comparison_model_1.Comparison.findOne(query).lean();
        if (!comparison)
            throw new app_error_util_1.AppError('Comparison not found', 404);
        // Fetch compared cars in parallel
        const [car1, car2] = await Promise.all([
            car_model_1.Car.findOne({ car_id: comparison.car1_id, is_deleted: false }).lean(),
            car_model_1.Car.findOne({ car_id: comparison.car2_id, is_deleted: false }).lean(),
        ]);
        return {
            ...comparison,
            car1_id: car1 || comparison.car1_id,
            car2_id: car2 || comparison.car2_id,
        };
    }
    // Rival Management
    static async addRival(primaryCarId, rivalCarId, userId, strength = 50) {
        const session = await mongoose_1.default.startSession();
        safeStartTransaction(session);
        try {
            if (primaryCarId === rivalCarId)
                throw new app_error_util_1.AppError('Cannot set car as its own rival', 400);
            // Use findCarByEitherId (defined at top of file) which accepts both
            // UUID strings (car_id) and MongoDB ObjectIds — guards against CastErrors.
            const [car1, car2] = await Promise.all([
                findCarByEitherId(primaryCarId),
                findCarByEitherId(rivalCarId),
            ]);
            if (!car1 || !car2)
                throw new app_error_util_1.AppError('One or both cars not found', 404);
            await Promise.all([
                comparison_rival_model_1.ComparisonRival.findOneAndUpdate({ primary_car_id: primaryCarId, rival_car_id: rivalCarId }, {
                    primary_car_id: primaryCarId,
                    rival_car_id: rivalCarId,
                    relationship_strength: strength,
                    manual_mapping: true,
                }, session.inTransaction() ? { upsert: true, session } : { upsert: true }),
                comparison_rival_model_1.ComparisonRival.findOneAndUpdate({ primary_car_id: rivalCarId, rival_car_id: primaryCarId }, {
                    primary_car_id: rivalCarId,
                    rival_car_id: primaryCarId,
                    relationship_strength: strength,
                    manual_mapping: true,
                }, session.inTransaction() ? { upsert: true, session } : { upsert: true }),
            ]);
            await audit_log_model_1.AuditLog.create([{
                    audit_id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    entity_type: 'car',
                    entity_id: primaryCarId,
                    action: 'update',
                    actor_user_id: userId,
                    new_value: { rival_id: rivalCarId },
                }], session.inTransaction() ? { session } : {});
            if (session.inTransaction()) {
                await session.commitTransaction();
            }
        }
        catch (error) {
            if (session.inTransaction()) {
                await session.abortTransaction();
            }
            throw error;
        }
        finally {
            session.endSession();
        }
    }
    static async removeRival(primaryCarId, rivalCarId, userId) {
        const session = await mongoose_1.default.startSession();
        safeStartTransaction(session);
        try {
            await Promise.all([
                comparison_rival_model_1.ComparisonRival.deleteOne({ primary_car_id: primaryCarId, rival_car_id: rivalCarId }, session.inTransaction() ? { session } : {}),
                comparison_rival_model_1.ComparisonRival.deleteOne({ primary_car_id: rivalCarId, rival_car_id: primaryCarId }, session.inTransaction() ? { session } : {}),
            ]);
            await audit_log_model_1.AuditLog.create([{
                    audit_id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    entity_type: 'car',
                    entity_id: primaryCarId,
                    action: 'update',
                    actor_user_id: userId,
                    old_value: { rival_id: rivalCarId },
                }], session.inTransaction() ? { session } : {});
            if (session.inTransaction()) {
                await session.commitTransaction();
            }
        }
        catch (error) {
            if (session.inTransaction()) {
                await session.abortTransaction();
            }
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