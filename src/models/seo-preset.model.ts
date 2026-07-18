/**
 * Named SEO landing page derived from a fixed set of discovery filters.
 * `query_params` matches `DiscoveryFilters` (csv strings on plural keys).
 */
import { BaseModel } from '../sql/common/BaseModel';
export interface ISeoPreset {
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

export const SeoPreset = new BaseModel<ISeoPreset>('SeoPresets', 'preset_id');
