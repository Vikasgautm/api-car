import { v4 as uuidv4 } from 'uuid';
import {
  IMAGE_STATUSES,
  ImageStatus,
  MAIN_CATEGORIES,
  MainCategory,
  MEDIA_SCOPES,
  MediaScope,
  ALL_SUBCATEGORIES,
  SubCategory,
} from '../shared/services/media/media-constants';

export interface ICarImage  {
  car_image_id: string;
  image_uuid?: string;
  car_id: string;
  variant_id?: string;

  // ─── New enum-based categorisation ───────────────────────────────────────
  main_category?: MainCategory;
  sub_category?: SubCategory;
  media_scope: MediaScope;
  normalized_color?: string;   // hex value for colours subcategory
  display_color_name?: string; // human label e.g. "Pearl White"

  // ─── Legacy FK-based categorisation (kept for backward compat) ───────────
  category_id?: string;
  sub_category_id?: string;

  // ─── Core image data ─────────────────────────────────────────────────────
  url: string;
  thumbnail_url?: string;      // kept for backward compat; NOT stored separately in Cloudinary
  image_hash?: string;         // SHA-256 of the uploaded binary for duplicate detection

  // ─── SEO fields (auto-generated if not provided) ─────────────────────────
  image_title?: string;
  alt_text?: string;
  caption?: string;

  // ─── Status workflow ──────────────────────────────────────────────────────
  status: ImageStatus;

  // ─── Display / ordering ───────────────────────────────────────────────────
  sort_order: number;
  display_order?: number;       // legacy alias
  is_primary: boolean;

  // ─── Legacy boolean (aliased from status for backward compat) ─────────────
  is_published: boolean;
  is_deleted: boolean;

  // ─── Metadata ─────────────────────────────────────────────────────────────
  tags?: string[];
  source?: string;
  uploaded_by?: string;
  taken_at?: Date;

  // ─── Legacy inspection fields (kept intact) ───────────────────────────────
  car_condition?: string;
  damage_area?: string;
  damage_note?: string;
  inspection_severity?: string;
  metadata?: Record<string, any>;
}

import { BaseModel } from '../sql/common/BaseModel';
export const CarImage = new BaseModel<ICarImage>('CarImages', 'image_id');
