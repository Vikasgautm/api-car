import { Document } from 'mongoose';
/**
 * Named SEO landing page derived from a fixed set of discovery filters.
 * `query_params` matches `DiscoveryFilters` (csv strings on plural keys).
 */
export interface ISeoPreset extends Document {
    preset_id: string;
    slug: string;
    title: string;
    h1?: string | null;
    meta_description?: string | null;
    meta_keywords?: string | null;
    hero_intro?: string | null;
    query_params: Record<string, string>;
    is_published: boolean;
    is_deleted: boolean;
    sort_order: number;
}
export declare const SeoPreset: import("mongoose").Model<ISeoPreset, {}, {}, {}, Document<unknown, {}, ISeoPreset, {}, import("mongoose").DefaultSchemaOptions> & ISeoPreset & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, ISeoPreset>;
//# sourceMappingURL=seo-preset.model.d.ts.map