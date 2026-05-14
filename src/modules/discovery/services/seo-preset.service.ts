import { v4 as uuidv4 } from 'uuid';
import { ISeoPreset, SeoPreset } from '../../../models/seo-preset.model';
import { AppError } from '../../../shared/utils/app-error.util';
import { PaginationUtil } from '../../../shared/utils/pagination.util';
import { SlugUtil } from '../../../shared/utils/slug.util';
import { DiscoveryFilters, DiscoveryService } from './discovery.service';

export class SeoPresetService {
  static async list(params: { page?: number; limit?: number; q?: string; is_published?: boolean; include_deleted?: boolean }) {
    const filter: Record<string, unknown> = {};
    if (!params.include_deleted) filter.is_deleted = false;
    if (params.is_published !== undefined) filter.is_published = params.is_published;
    if (params.q) filter.title = { $regex: params.q, $options: 'i' };

    const pageNum = params.page ?? 1;
    const limitNum = params.limit ?? 25;
    const { skip, limit } = PaginationUtil.getPaginationParams(pageNum, limitNum);

    const [rows, total] = await Promise.all([
      SeoPreset.find(filter).sort({ sort_order: 1, title: 1 }).skip(skip).limit(limit).lean(),
      SeoPreset.countDocuments(filter),
    ]);

    return { presets: rows, pagination: PaginationUtil.createPaginationMeta(pageNum, limit, total) };
  }

  static async getById(presetId: string) {
    return SeoPreset.findOne({ preset_id: presetId, is_deleted: false }).lean();
  }

  static async getBySlug(slug: string) {
    return SeoPreset.findOne({ slug, is_deleted: false, is_published: true }).lean();
  }

  static async create(data: any): Promise<ISeoPreset> {
    const baseSlug = SlugUtil.generate(data.slug || data.title);
    if (!baseSlug) throw new AppError('slug is required', 400);

    const existing = await SeoPreset.findOne({ slug: baseSlug, is_deleted: false });
    if (existing) {
      throw new AppError(`SEO preset with slug "${baseSlug}" already exists.`, 409);
    }

    return SeoPreset.create({
      preset_id: uuidv4(),
      slug: baseSlug,
      title: data.title,
      h1: data.h1 ?? null,
      meta_description: data.meta_description ?? null,
      meta_keywords: data.meta_keywords ?? null,
      hero_intro: data.hero_intro ?? null,
      query_params: data.query_params ?? {},
      is_published: data.is_published !== undefined ? data.is_published : true,
      sort_order: data.sort_order ?? 0,
      is_deleted: false,
    });
  }

  static async update(presetId: string, data: any) {
    const update: Partial<ISeoPreset> = {};
    if (data.slug !== undefined) {
      const newSlug = SlugUtil.generate(data.slug);
      const conflict = await SeoPreset.findOne({ slug: newSlug, preset_id: { $ne: presetId }, is_deleted: false } as any);
      if (conflict) throw new AppError(`SEO preset with slug "${newSlug}" already exists.`, 409);
      update.slug = newSlug;
    }
    if (data.title !== undefined) update.title = data.title;
    if (data.h1 !== undefined) update.h1 = data.h1;
    if (data.meta_description !== undefined) update.meta_description = data.meta_description;
    if (data.meta_keywords !== undefined) update.meta_keywords = data.meta_keywords;
    if (data.hero_intro !== undefined) update.hero_intro = data.hero_intro;
    if (data.query_params !== undefined) update.query_params = data.query_params;
    if (data.is_published !== undefined) update.is_published = data.is_published;
    if (data.sort_order !== undefined) update.sort_order = data.sort_order;

    const updated = await SeoPreset.findOneAndUpdate(
      { preset_id: presetId, is_deleted: false } as any,
      update,
      { returnDocument: 'after' }
    );
    if (!updated) throw new AppError(`SEO preset not found: ${presetId}`, 404);
    return updated;
  }

  static async softDelete(presetId: string) {
    const updated = await SeoPreset.findOneAndUpdate(
      { preset_id: presetId, is_deleted: false },
      { is_deleted: true },
      { returnDocument: 'after' }
    );
    if (!updated) throw new AppError(`SEO preset not found: ${presetId}`, 404);
    return updated;
  }

  /**
   * Hydrate a preset: return the preset itself plus the discovery results when
   * its query_params are applied. Used by the public landing page route.
   */
  static async hydrate(slug: string, overridePage?: number | string) {
    const preset = await this.getBySlug(slug);
    if (!preset) throw AppError.notFound('SEO preset', 'slug', slug);

    const filters: DiscoveryFilters = {
      ...(preset.query_params as DiscoveryFilters),
      ...(overridePage !== undefined ? { page: overridePage } : {}),
    };
    const result = await DiscoveryService.discover(filters);
    return { preset, ...result };
  }
}
