import { Comparison, IComparison } from '../../../models/comparison.model';
import { ComparisonRival, IComparisonRival } from '../../../models/comparison-rival.model';
import { Car } from '../../../models/car.model';
import { CarVariant } from '../../../models/car-variant.model';
import { AuditLog } from '../../../models/audit-log.model';
import { AppError } from '../../../shared/utils/app-error.util';
import { CreateComparisonDTOType, UpdateComparisonDTOType } from '../../../shared/dto/comparison.dto';
import { generateSlugWithIncrement } from '../../../shared/utils/slug.util';
import mongoose from 'mongoose';

export class ComparisonService {
  static async createComparison(
    data: CreateComparisonDTOType,
    userId: string,
  ): Promise<IComparison> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const car1Id = new mongoose.Types.ObjectId(data.car1_id);
      const car2Id = new mongoose.Types.ObjectId(data.car2_id);

      // Validate cars exist
      const [car1, car2] = await Promise.all([
        Car.findById(car1Id),
        Car.findById(car2Id),
      ]);

      if (!car1) throw new AppError('Car 1 not found', 404);
      if (!car2) throw new AppError('Car 2 not found', 404);
      if (car1Id.equals(car2Id)) throw new AppError('Cannot compare the same car', 400);

      // Generate unique slug
      let slug = data.slug;
      const existingSlug = await Comparison.findOne({ slug });
      if (existingSlug) {
        slug = await generateSlugWithIncrement(data.slug, Comparison, 'slug');
      }

      // Validate variants if provided
      if (data.variant1_id) {
        const variant1 = await CarVariant.findById(data.variant1_id);
        if (!variant1) throw new AppError('Variant 1 not found', 404);
      }
      if (data.variant2_id) {
        const variant2 = await CarVariant.findById(data.variant2_id);
        if (!variant2) throw new AppError('Variant 2 not found', 404);
      }

      // Create comparison
      const comparison = new Comparison({
        car1_id: car1Id,
        car2_id: car2Id,
        variant1_id: data.variant1_id ? new mongoose.Types.ObjectId(data.variant1_id) : undefined,
        variant2_id: data.variant2_id ? new mongoose.Types.ObjectId(data.variant2_id) : undefined,
        slug,
        title: data.title,
        category: data.category,
        description: data.description,
        compareIntroContent: data.compareIntroContent,
        isPopular: data.isPopular || false,
        isTrending: data.isTrending || false,
        showOnHomepage: data.showOnHomepage || false,
        relatedComparisons: data.relatedComparisons?.map(id => new mongoose.Types.ObjectId(id)) || [],
        seoMetaTitle: data.seoMetaTitle,
        seoMetaDescription: data.seoMetaDescription,
        seoFAQSchema: data.seoFAQSchema,
        status: data.status || 'draft',
        is_published: data.is_published || false,
        created_by: new mongoose.Types.ObjectId(userId),
      });

      await comparison.save({ session });

      // Log audit
      await AuditLog.create([{
        audit_id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        entity_type: 'comparison' as any,
        entity_id: comparison._id.toString(),
        action: 'create' as any,
        actor_user_id: userId,
        new_value: { slug, title: data.title },
      }], { session });

      await session.commitTransaction();
      return comparison.populate(['car1_id', 'car2_id', 'variant1_id', 'variant2_id']);
    } catch (error) {
      await session.abortTransaction();
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
    session.startTransaction();

    try {
      const comparison = await Comparison.findById(comparisonId).session(session);
      if (!comparison) throw new AppError('Comparison not found', 404);

      // Check slug uniqueness if being changed
      if (data.slug && data.slug !== comparison.slug) {
        const existingSlug = await Comparison.findOne({ slug: data.slug }).session(session);
        if (existingSlug) {
          data.slug = await generateSlugWithIncrement(data.slug, Comparison, 'slug');
        }
      }

      Object.assign(comparison, {
        ...data,
        updated_by: new mongoose.Types.ObjectId(userId),
      });

      await comparison.save({ session });

      await AuditLog.create([{
        audit_id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        entity_type: 'comparison' as any,
        entity_id: comparison._id.toString(),
        action: 'update' as any,
        actor_user_id: userId,
        new_value: data,
      }], { session });

      await session.commitTransaction();
      return comparison.populate(['car1_id', 'car2_id', 'variant1_id', 'variant2_id']);
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  static async deleteComparison(comparisonId: string, userId: string): Promise<void> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const comparison = await Comparison.findByIdAndUpdate(
        comparisonId,
        {
          is_deleted: true,
          deleted_at: new Date(),
          status: 'archived',
        },
        { new: true, session },
      );

      if (!comparison) throw new AppError('Comparison not found', 404);

      await AuditLog.create([{
        audit_id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        entity_type: 'comparison' as any,
        entity_id: comparison._id.toString(),
        action: 'delete' as any,
        actor_user_id: userId,
        new_value: { slug: comparison.slug },
      }], { session });

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  static async restoreComparison(comparisonId: string, userId: string): Promise<IComparison> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const comparison = await Comparison.findByIdAndUpdate(
        comparisonId,
        {
          is_deleted: false,
          deleted_at: null,
          status: 'draft',
        },
        { new: true, session },
      );

      if (!comparison) throw new AppError('Comparison not found', 404);

      await AuditLog.create([{
        audit_id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        entity_type: 'comparison' as any,
        entity_id: comparison._id.toString(),
        action: 'restore' as any,
        actor_user_id: userId,
        new_value: { slug: comparison.slug },
      }], { session });

      await session.commitTransaction();
      return comparison;
    } catch (error) {
      await session.abortTransaction();
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

  static async getComparisonBySlug(slug: string): Promise<IComparison> {
    const comparison = await Comparison.findOne({ slug, is_deleted: false })
      .populate('car1_id')
      .populate('car2_id')
      .populate('variant1_id')
      .populate('variant2_id')
      .populate('relatedComparisons');

    if (!comparison) throw new AppError('Comparison not found', 404);
    return comparison;
  }

  static async getComparisonById(id: string): Promise<IComparison> {
    const comparison = await Comparison.findById(id)
      .populate('car1_id')
      .populate('car2_id')
      .populate('variant1_id')
      .populate('variant2_id')
      .populate('relatedComparisons');

    if (!comparison) throw new AppError('Comparison not found', 404);
    return comparison;
  }

  // Rival Management
  static async addRival(
    primaryCarId: string,
    rivalCarId: string,
    userId: string,
    strength: number = 50,
  ): Promise<void> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const pId = new mongoose.Types.ObjectId(primaryCarId);
      const rId = new mongoose.Types.ObjectId(rivalCarId);

      if (pId.equals(rId)) throw new AppError('Cannot set car as its own rival', 400);

      // Create both directions
      const [car1, car2] = await Promise.all([
        Car.findById(pId).session(session),
        Car.findById(rId).session(session),
      ]);

      if (!car1 || !car2) throw new AppError('One or both cars not found', 404);

      await Promise.all([
        ComparisonRival.findOneAndUpdate(
          { primary_car_id: pId, rival_car_id: rId },
          {
            primary_car_id: pId,
            rival_car_id: rId,
            relationship_strength: strength,
            manual_mapping: true,
          },
          { upsert: true, session },
        ),
        ComparisonRival.findOneAndUpdate(
          { primary_car_id: rId, rival_car_id: pId },
          {
            primary_car_id: rId,
            rival_car_id: pId,
            relationship_strength: strength,
            manual_mapping: true,
          },
          { upsert: true, session },
        ),
      ]);

      await AuditLog.create([{
        audit_id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        entity_type: 'car' as any,
        entity_id: pId.toString(),
        action: 'update' as any,
        actor_user_id: userId,
        new_value: { rival_id: rId.toString() },
      }], { session });

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
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
    session.startTransaction();

    try {
      const pId = new mongoose.Types.ObjectId(primaryCarId);
      const rId = new mongoose.Types.ObjectId(rivalCarId);

      await Promise.all([
        ComparisonRival.deleteOne({ primary_car_id: pId, rival_car_id: rId }, { session }),
        ComparisonRival.deleteOne({ primary_car_id: rId, rival_car_id: pId }, { session }),
      ]);

      await AuditLog.create([{
        audit_id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        entity_type: 'car' as any,
        entity_id: pId.toString(),
        action: 'update' as any,
        actor_user_id: userId,
        old_value: { rival_id: rId.toString() },
      }], { session });

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  static async getRivals(carId: string, limit: number = 10): Promise<IComparisonRival[]> {
    const cId = new mongoose.Types.ObjectId(carId);
    return ComparisonRival.find({ primary_car_id: cId })
      .populate('rival_car_id', 'brand slug')
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
      .populate('car1_id', 'brand slug')
      .populate('car2_id', 'brand slug')
      .sort({ created_at: -1 })
      .limit(limit)
      .lean();
  }

  static async getTrendingComparisons(limit: number = 10) {
    return Comparison.find({ is_published: true, is_deleted: false, isTrending: true })
      .populate('car1_id', 'brand slug')
      .populate('car2_id', 'brand slug')
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
      .populate('car1_id', 'brand slug image')
      .populate('car2_id', 'brand slug image')
      .sort({ created_at: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return { comparisons, total, page, limit };
  }
}
