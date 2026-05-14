import { Document, Schema, model } from 'mongoose';

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

const seoPresetSchema = new Schema<ISeoPreset>(
  {
    preset_id: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    h1: { type: String, default: null },
    meta_description: { type: String, default: null, maxlength: 160 },
    meta_keywords: { type: String, default: null },
    hero_intro: { type: String, default: null, maxlength: 2000 },
    query_params: { type: Schema.Types.Mixed, default: {} },
    is_published: { type: Boolean, default: true },
    is_deleted: { type: Boolean, default: false },
    sort_order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

seoPresetSchema.index({ is_published: 1, is_deleted: 1 });
seoPresetSchema.index({ sort_order: 1 });

export const SeoPreset = model<ISeoPreset>('SeoPreset', seoPresetSchema);
