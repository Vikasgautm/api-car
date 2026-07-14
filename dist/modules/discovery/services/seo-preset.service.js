"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeoPresetService = void 0;
const uuid_1 = require("uuid");
const seo_preset_model_1 = require("../../../models/seo-preset.model");
const app_error_util_1 = require("../../../shared/utils/app-error.util");
const pagination_util_1 = require("../../../shared/utils/pagination.util");
const slug_util_1 = require("../../../shared/utils/slug.util");
const discovery_service_1 = require("./discovery.service");
class SeoPresetService {
    static async list(params) {
        const filter = {};
        if (!params.include_deleted)
            filter.is_deleted = false;
        if (params.is_published !== undefined)
            filter.is_published = params.is_published;
        if (params.q)
            filter.title = { $regex: params.q, $options: 'i' };
        const pageNum = params.page ?? 1;
        const limitNum = params.limit ?? 25;
        const { skip, limit } = pagination_util_1.PaginationUtil.getPaginationParams(pageNum, limitNum);
        const [rows, total] = await Promise.all([
            seo_preset_model_1.SeoPreset.find(filter).sort({ sort_order: 1, title: 1 }).skip(skip).limit(limit).lean(),
            seo_preset_model_1.SeoPreset.countDocuments(filter),
        ]);
        return { presets: rows, pagination: pagination_util_1.PaginationUtil.createPaginationMeta(pageNum, limit, total) };
    }
    static async getById(presetId) {
        return seo_preset_model_1.SeoPreset.findOne({ preset_id: presetId, is_deleted: false }).lean();
    }
    static async getBySlug(slug) {
        return seo_preset_model_1.SeoPreset.findOne({ slug, is_deleted: false, is_published: true }).lean();
    }
    static async create(data) {
        const baseSlug = slug_util_1.SlugUtil.generate(data.slug || data.title);
        if (!baseSlug)
            throw new app_error_util_1.AppError('slug is required', 400);
        const existing = await seo_preset_model_1.SeoPreset.findOne({ slug: baseSlug, is_deleted: false });
        if (existing) {
            throw new app_error_util_1.AppError(`SEO preset with slug "${baseSlug}" already exists.`, 409);
        }
        return seo_preset_model_1.SeoPreset.create({
            preset_id: (0, uuid_1.v4)(),
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
    static async update(presetId, data) {
        const update = {};
        if (data.slug !== undefined) {
            const newSlug = slug_util_1.SlugUtil.generate(data.slug);
            const conflict = await seo_preset_model_1.SeoPreset.findOne({ slug: newSlug, preset_id: { $ne: presetId }, is_deleted: false });
            if (conflict)
                throw new app_error_util_1.AppError(`SEO preset with slug "${newSlug}" already exists.`, 409);
            update.slug = newSlug;
        }
        if (data.title !== undefined)
            update.title = data.title;
        if (data.h1 !== undefined)
            update.h1 = data.h1;
        if (data.meta_description !== undefined)
            update.meta_description = data.meta_description;
        if (data.meta_keywords !== undefined)
            update.meta_keywords = data.meta_keywords;
        if (data.hero_intro !== undefined)
            update.hero_intro = data.hero_intro;
        if (data.query_params !== undefined)
            update.query_params = data.query_params;
        if (data.is_published !== undefined)
            update.is_published = data.is_published;
        if (data.sort_order !== undefined)
            update.sort_order = data.sort_order;
        const updated = await seo_preset_model_1.SeoPreset.findOneAndUpdate({ preset_id: presetId, is_deleted: false }, update, { returnDocument: 'after' });
        if (!updated)
            throw new app_error_util_1.AppError(`SEO preset not found: ${presetId}`, 404);
        return updated;
    }
    static async softDelete(presetId) {
        const updated = await seo_preset_model_1.SeoPreset.findOneAndUpdate({ preset_id: presetId, is_deleted: false }, { is_deleted: true }, { returnDocument: 'after' });
        if (!updated)
            throw new app_error_util_1.AppError(`SEO preset not found: ${presetId}`, 404);
        return updated;
    }
    /**
     * Hydrate a preset: return the preset itself plus the discovery results when
     * its query_params are applied. Used by the public landing page route.
     */
    static async hydrate(slug, overridePage) {
        const preset = await this.getBySlug(slug);
        if (!preset)
            throw app_error_util_1.AppError.notFound('SEO preset', 'slug', slug);
        const filters = {
            ...preset.query_params,
            ...(overridePage !== undefined ? { page: overridePage } : {}),
        };
        const result = await discovery_service_1.DiscoveryService.discover(filters);
        return { preset, ...result };
    }
}
exports.SeoPresetService = SeoPresetService;
