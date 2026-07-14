import { v4 as uuidv4 } from 'uuid';
import {
  PopularCollection,
  IPopularCollection,
} from '../../../models/popular-collection.model';
import { AppError } from '../../../shared/utils/app-error.util';

export class PopularCollectionService {
  static async list(status?: string) {
    const filter: Record<string, any> = {};
    if (status) filter.status = status;
    return PopularCollection.find(filter)
      .sort({ hub_section_order: 1, createdAt: -1 })
      .lean();
  }

  static async getBySlug(slug: string) {
    const coll = await PopularCollection.findOne({ slug }).lean();
    if (!coll) throw new AppError(`Collection not found: ${slug}`, 404);
    return coll;
  }

  static async getById(collection_id: string) {
    const coll = await PopularCollection.findOne({ collection_id }).lean();
    if (!coll) throw new AppError('Collection not found', 404);
    return coll;
  }

  static async create(data: Partial<IPopularCollection>, userId?: string) {
    const existing = await PopularCollection.findOne({ slug: data.slug });
    if (existing) throw new AppError(`Slug already exists: ${data.slug}`, 400);

    return PopularCollection.create({
      ...data,
      collection_id: uuidv4(),
      created_by: userId,
      updated_by: userId,
    });
  }

  static async update(
    collection_id: string,
    data: Partial<IPopularCollection>,
    userId?: string
  ) {
    if (data.slug) {
      const existing = await PopularCollection.findOne({
        slug: data.slug,
        collection_id: { $ne: collection_id },
      });
      if (existing) throw new AppError(`Slug already exists: ${data.slug}`, 400);
    }

    const updated = await PopularCollection.findOneAndUpdate(
      { collection_id },
      { ...data, updated_by: userId },
      { new: true }
    );
    if (!updated) throw new AppError('Collection not found', 404);
    return updated;
  }

  static async remove(collection_id: string) {
    const result = await PopularCollection.findOneAndDelete({ collection_id });
    if (!result) throw new AppError('Collection not found', 404);
    return result;
  }

  static async updateCarOrdering(
    collection_id: string,
    payload: {
      pinned_car_ids?: string[];
      manual_car_ids?: string[];
      suppressed_car_ids?: string[];
    },
    userId?: string
  ) {
    const update: Record<string, any> = { updated_by: userId };
    if (payload.pinned_car_ids !== undefined) update.pinned_car_ids = payload.pinned_car_ids;
    if (payload.manual_car_ids !== undefined) update.manual_car_ids = payload.manual_car_ids;
    if (payload.suppressed_car_ids !== undefined) update.suppressed_car_ids = payload.suppressed_car_ids;

    const updated = await PopularCollection.findOneAndUpdate(
      { collection_id },
      update,
      { new: true }
    );
    if (!updated) throw new AppError('Collection not found', 404);
    return updated;
  }

  static async updateRenderingMode(
    collection_id: string,
    payload: {
      rendering_mode: string;
      manual_weight?: number;
      behavioral_weight?: number;
      min_behavioral_confidence?: number;
    },
    userId?: string
  ) {
    const updated = await PopularCollection.findOneAndUpdate(
      { collection_id },
      { ...payload, updated_by: userId },
      { new: true }
    );
    if (!updated) throw new AppError('Collection not found', 404);
    return updated;
  }

  static async publish(collection_id: string, userId?: string) {
    const updated = await PopularCollection.findOneAndUpdate(
      { collection_id },
      { status: 'published', updated_by: userId },
      { new: true }
    );
    if (!updated) throw new AppError('Collection not found', 404);
    return updated;
  }

  static async archive(collection_id: string, userId?: string) {
    const updated = await PopularCollection.findOneAndUpdate(
      { collection_id },
      { status: 'archived', updated_by: userId },
      { new: true }
    );
    if (!updated) throw new AppError('Collection not found', 404);
    return updated;
  }

  static async reorderHubSections(orderedIds: string[], userId?: string) {
    const ops = orderedIds.map((collection_id, idx) =>
      PopularCollection.updateOne(
        { collection_id },
        { hub_section_order: idx, updated_by: userId }
      )
    );
    await Promise.all(ops);
  }
}
