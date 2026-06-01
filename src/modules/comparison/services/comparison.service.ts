import { Comparison, IComparison } from '../../../models/comparison.model';
import { ComparisonRival, IComparisonRival } from '../../../models/comparison-rival.model';
import { Car } from '../../../models/car.model';
import { CarVariant } from '../../../models/car-variant.model';
import { AuditLog } from '../../../models/audit-log.model';
import { AppError } from '../../../shared/utils/app-error.util';
import { CreateComparisonDTOType, UpdateComparisonDTOType } from '../../../shared/dto/comparison.dto';
import { generateSlugWithIncrement } from '../../../shared/utils/slug.util';
import mongoose from 'mongoose';

// Accept either UUID (car_id, the cross-app canonical key) or MongoDB _id.
// Old payloads sent _id; rest of the codebase uses car_id, so be tolerant.
async function findCarByEitherId(id: string) {
  if (!id) return null;
  let car = await Car.findOne({ car_id: id, is_deleted: false });
  if (car) return car;
  if (mongoose.Types.ObjectId.isValid(id) && id.length === 24) {
    car = await Car.findById(id);
  }
  return car;
}

function safeStartTransaction(session: mongoose.ClientSession) {
  try {
    const conn = mongoose.connection as any;
    const topologyType = conn.client?.topology?.description?.type;
    if (topologyType === 'Single') {
      // Standalone MongoDB doesn't support transactions
      return;
    }
    session.startTransaction();
  } catch (err) {
    // standalone MongoDB support
  }
}

export class ComparisonService {
  static async createComparison(
    data: CreateComparisonDTOType,
    userId: string,
  ): Promise<IComparison> {
    const session = await mongoose.startSession();
    safeStartTransaction(session);

    try {
      const [car1, car2] = await Promise.all([
        findCarByEitherId(data.car1_id),
        findCarByEitherId(data.car2_id),
      ]);

      if (!car1) throw new AppError(`Car 1 not found (id: ${data.car1_id})`, 404, { errorCode: 'CAR_NOT_FOUND' });
      if (!car2) throw new AppError(`Car 2 not found (id: ${data.car2_id})`, 404, { errorCode: 'CAR_NOT_FOUND' });
      if (data.car1_id === data.car2_id) throw new AppError('Cannot compare the same car', 400, { errorCode: 'INVALID_INPUT' });

      // Generate unique slug
      let slug = data.slug;
      const existingSlug = await Comparison.findOne({ slug });
      if (existingSlug) {
        throw new AppError('Comparison with this slug already exists', 409, { errorCode: 'SLUG_ALREADY_EXISTS' });
      }

      // Validate variants if provided
      if (data.variant1_id) {
        const variant1 = await CarVariant.findOne({ variant_id: data.variant1_id });
        if (!variant1) throw new AppError('Variant 1 not found', 404);
      }
      if (data.variant2_id) {
        const variant2 = await CarVariant.findOne({ variant_id: data.variant2_id });
        if (!variant2) throw new AppError('Variant 2 not found', 404);
      }

      // Create comparison
      const comparison = new Comparison({
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
      await AuditLog.create([{
        audit_id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        entity_type: 'comparison' as any,
        entity_id: comparison._id.toString(),
        action: 'create' as any,
        actor_user_id: userId,
        new_value: { slug, title: data.title },
      }], session.inTransaction() ? { session } : {});

      if (session.inTransaction()) {
        await session.commitTransaction();
      }
      return comparison;
    } catch (error) {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }
      throw error;
    } finally {
      session.endSession();
    }
  }

  static async updateComparison(
    comparisonId: string,
    data: UpdateComparisonDTOType,
    userId: string,
  ): Promise<IComparison> {
    const session = await mongoose.startSession();
    safeStartTransaction(session);

    try {
      const comparison = await Comparison.findOne({ comparison_id: comparisonId, is_deleted: false }).session(session.inTransaction() ? session : null as any);
      if (!comparison) throw new AppError('Comparison not found', 404);

      // Check slug uniqueness if being changed
      if (data.slug && data.slug !== comparison.slug) {
        const existingSlug = await Comparison.findOne({ slug: data.slug }).session(session.inTransaction() ? session : null as any);
        if (existingSlug) {
          data.slug = await generateSlugWithIncrement(data.slug, Comparison, 'slug');
        }
      }

      Object.assign(comparison, {
        ...data,
        updated_by: userId,
      });

      await comparison.save(session.inTransaction() ? { session } : {});

      await AuditLog.create([{
        audit_id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        entity_type: 'comparison' as any,
        entity_id: comparison._id.toString(),
        action: 'update' as any,
        actor_user_id: userId,
        new_value: data,
      }], session.inTransaction() ? { session } : {});

      if (session.inTransaction()) {
        await session.commitTransaction();
      }
      return comparison;
    } catch (error) {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }
      throw error;
    } finally {
      session.endSession();
    }
  }

  static async deleteComparison(comparisonId: string, userId: string): Promise<void> {
    const session = await mongoose.startSession();
    safeStartTransaction(session);

    try {
      const query: any = { is_deleted: false };
      if (mongoose.Types.ObjectId.isValid(comparisonId) && comparisonId.length === 24) {
        query.$or = [{ comparison_id: comparisonId }, { _id: comparisonId }];
      } else {
        query.comparison_id = comparisonId;
      }

      const comparison = await Comparison.findOneAndUpdate(
        query,
        {
          is_deleted: true,
          deleted_at: new Date(),
          status: 'archived',
        },
        session.inTransaction() ? { new: true, session } : { new: true },
      );

      if (!comparison) throw new AppError('Comparison not found', 404);

      await AuditLog.create([{
        audit_id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        entity_type: 'comparison' as any,
        entity_id: comparison._id.toString(),
        action: 'delete' as any,
        actor_user_id: userId,
        new_value: { slug: comparison.slug },
      }], session.inTransaction() ? { session } : {});

      if (session.inTransaction()) {
        await session.commitTransaction();
      }
    } catch (error) {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }
      throw error;
    } finally {
      session.endSession();
    }
  }

  static async restoreComparison(comparisonId: string, userId: string): Promise<IComparison> {
    const session = await mongoose.startSession();
    safeStartTransaction(session);

    try {
      const query: any = { is_deleted: true };
      if (mongoose.Types.ObjectId.isValid(comparisonId) && comparisonId.length === 24) {
        query.$or = [{ comparison_id: comparisonId }, { _id: comparisonId }];
      } else {
        query.comparison_id = comparisonId;
      }

      const comparison = await Comparison.findOneAndUpdate(
        query,
        {
          is_deleted: false,
          deleted_at: null,
          status: 'draft',
        },
        session.inTransaction() ? { new: true, session } : { new: true },
      );

      if (!comparison) throw new AppError('Comparison not found', 404);

      await AuditLog.create([{
        audit_id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        entity_type: 'comparison' as any,
        entity_id: comparison._id.toString(),
        action: 'restore' as any,
        actor_user_id: userId,
        new_value: { slug: comparison.slug },
      }], session.inTransaction() ? { session } : {});

      if (session.inTransaction()) {
        await session.commitTransaction();
      }
      return comparison;
    } catch (error) {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }
      throw error;
    } finally {
      session.endSession();
    }
  }

  static async getComparisons(
    page: number = 1,
    limit: number = 10,
    filter: {
      search?: string;
      category?: string;
      status?: string;
      isPopular?: boolean;
      isTrending?: boolean;
      is_deleted?: boolean;
    } = {},
  ) {
    const query: any = { is_deleted: filter.is_deleted || false };

    if (filter.search) {
      query.$or = [
        { title: { $regex: filter.search, $options: 'i' } },
        { slug: { $regex: filter.search, $options: 'i' } },
      ];
    }

    if (filter.category) query.category = filter.category;
    if (filter.status) query.status = filter.status;
    if (filter.isPopular !== undefined) query.isPopular = filter.isPopular;
    if (filter.isTrending !== undefined) query.isTrending = filter.isTrending;

    const total = await Comparison.countDocuments(query);
    const comparisons = await Comparison.find(query)
      
      
      
      
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

  static async getComparisonBySlug(slug: string): Promise<any> {
    const comparison = await Comparison.findOne({ slug, is_deleted: false }).lean();

    if (!comparison) throw new AppError('Comparison not found', 404);

    // Fetch compared cars in parallel
    const [car1, car2] = await Promise.all([
      Car.findOne({ car_id: comparison.car1_id, is_deleted: false }).lean(),
      Car.findOne({ car_id: comparison.car2_id, is_deleted: false }).lean(),
    ]);

    return {
      ...comparison,
      car1_id: car1 || comparison.car1_id,
      car2_id: car2 || comparison.car2_id,
    };
  }

  static async getComparisonById(id: string): Promise<any> {
    const query: any = { is_deleted: false };
    if (mongoose.Types.ObjectId.isValid(id) && id.length === 24) {
      query.$or = [{ comparison_id: id }, { _id: id }];
    } else {
      query.comparison_id = id;
    }

    const comparison = await Comparison.findOne(query).lean();

    if (!comparison) throw new AppError('Comparison not found', 404);

    // Fetch compared cars in parallel
    const [car1, car2] = await Promise.all([
      Car.findOne({ car_id: comparison.car1_id, is_deleted: false }).lean(),
      Car.findOne({ car_id: comparison.car2_id, is_deleted: false }).lean(),
    ]);

    return {
      ...comparison,
      car1_id: car1 || comparison.car1_id,
      car2_id: car2 || comparison.car2_id,
    };
  }

  // Rival Management
  static async addRival(
    primaryCarId: string,
    rivalCarId: string,
    userId: string,
    strength: number = 50,
  ): Promise<void> {
    const session = await mongoose.startSession();
    safeStartTransaction(session);

    try {
      if (primaryCarId === rivalCarId) throw new AppError('Cannot set car as its own rival', 400);

      // Use findCarByEitherId (defined at top of file) which accepts both
      // UUID strings (car_id) and MongoDB ObjectIds — guards against CastErrors.
      const [car1, car2] = await Promise.all([
        findCarByEitherId(primaryCarId),
        findCarByEitherId(rivalCarId),
      ]);

      if (!car1 || !car2) throw new AppError('One or both cars not found', 404);

      await Promise.all([
        ComparisonRival.findOneAndUpdate(
          { primary_car_id: primaryCarId, rival_car_id: rivalCarId },
          {
            primary_car_id: primaryCarId,
            rival_car_id: rivalCarId,
            relationship_strength: strength,
            manual_mapping: true,
          },
          session.inTransaction() ? { upsert: true, session } : { upsert: true },
        ),
        ComparisonRival.findOneAndUpdate(
          { primary_car_id: rivalCarId, rival_car_id: primaryCarId },
          {
            primary_car_id: rivalCarId,
            rival_car_id: primaryCarId,
            relationship_strength: strength,
            manual_mapping: true,
          },
          session.inTransaction() ? { upsert: true, session } : { upsert: true },
        ),
      ]);

      await AuditLog.create([{
        audit_id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        entity_type: 'car' as any,
        entity_id: primaryCarId,
        action: 'update' as any,
        actor_user_id: userId,
        new_value: { rival_id: rivalCarId },
      }], session.inTransaction() ? { session } : {});

      if (session.inTransaction()) {
        await session.commitTransaction();
      }
    } catch (error) {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }
      throw error;
    } finally {
      session.endSession();
    }
  }

  static async removeRival(
    primaryCarId: string,
    rivalCarId: string,
    userId: string,
  ): Promise<void> {
    const session = await mongoose.startSession();
    safeStartTransaction(session);

    try {
      await Promise.all([
        ComparisonRival.deleteOne({ primary_car_id: primaryCarId, rival_car_id: rivalCarId }, session.inTransaction() ? { session } : {}),
        ComparisonRival.deleteOne({ primary_car_id: rivalCarId, rival_car_id: primaryCarId }, session.inTransaction() ? { session } : {}),
      ]);

      await AuditLog.create([{
        audit_id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        entity_type: 'car' as any,
        entity_id: primaryCarId,
        action: 'update' as any,
        actor_user_id: userId,
        old_value: { rival_id: rivalCarId },
      }], session.inTransaction() ? { session } : {});

      if (session.inTransaction()) {
        await session.commitTransaction();
      }
    } catch (error) {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }
      throw error;
    } finally {
      session.endSession();
    }
  }

  static async getRivals(carId: string, limit: number = 10): Promise<IComparisonRival[]> {
    return ComparisonRival.find({ primary_car_id: carId })
      .sort({ relationship_strength: -1 })
      .limit(limit)
      .lean();
  }

  static async getPopularComparisons(
    category?: string,
    limit: number = 10,
  ) {
    const query: any = { is_published: true, is_deleted: false, isPopular: true };
    if (category) query.category = category;

    return Comparison.find(query)
      
      
      .sort({ created_at: -1 })
      .limit(limit)
      .lean();
  }

  static async getTrendingComparisons(limit: number = 10) {
    return Comparison.find({ is_published: true, is_deleted: false, isTrending: true })
      
      
      .sort({ updated_at: -1 })
      .limit(limit)
      .lean();
  }

  static async getComparisonsByCategory(
    category: string,
    page: number = 1,
    limit: number = 10,
  ) {
    const total = await Comparison.countDocuments({
      category,
      is_published: true,
      is_deleted: false,
    });

    const comparisons = await Comparison.find({
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
