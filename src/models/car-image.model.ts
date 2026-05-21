import { Document, Schema, model } from 'mongoose';
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

export interface ICarImage extends Document {
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

const carImageSchema = new Schema<ICarImage>(
  {
    car_image_id: {
      type: String,
      default: () => uuidv4(),
      unique: true,
      required: true,
    },
    image_uuid: { type: String, sparse: true },
    car_id: { type: String, required: true },
    variant_id: { type: String },

    // Enum-based categorisation
    main_category: { type: String, enum: MAIN_CATEGORIES },
    sub_category: { type: String, enum: ALL_SUBCATEGORIES },
    media_scope: { type: String, enum: MEDIA_SCOPES, default: 'standard' },
    normalized_color: { type: String },
    display_color_name: { type: String },

    // Legacy FK categorisation
    category_id: { type: String },
    sub_category_id: { type: String },

    // Core image
    url: { type: String, required: true },
    thumbnail_url: { type: String },
    image_hash: { type: String },

    // SEO
    image_title: { type: String },
    alt_text: { type: String },
    caption: { type: String },

    // Status workflow
    status: { type: String, enum: IMAGE_STATUSES, default: 'draft' },

    // Display / ordering
    sort_order: { type: Number, default: 0 },
    display_order: { type: Number, default: 0 },
    is_primary: { type: Boolean, default: false },

    // Legacy boolean flags (kept for backward compat)
    is_published: { type: Boolean, default: false },
    is_deleted: { type: Boolean, default: false },

    // Metadata
    tags: { type: [String] },
    source: { type: String },
    uploaded_by: { type: String },
    taken_at: { type: Date },

    // Legacy inspection fields
    car_condition: { type: String },
    damage_area: { type: String },
    damage_note: { type: String },
    inspection_severity: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

// Primary retrieval patterns
carImageSchema.index({ car_id: 1, main_category: 1, sort_order: 1 });
carImageSchema.index({ car_id: 1, main_category: 1, sub_category: 1, sort_order: 1 });
carImageSchema.index({ car_id: 1, media_scope: 1, status: 1 });
carImageSchema.index({ car_id: 1, is_primary: 1, is_deleted: 1 });
carImageSchema.index({ car_id: 1, status: 1, is_deleted: 1 });

// Variant showcase
carImageSchema.index({ variant_id: 1, media_scope: 1, is_deleted: 1 });

// Duplicate detection
carImageSchema.index({ image_hash: 1, car_id: 1 });

// Legacy indexes
carImageSchema.index({ car_id: 1, category_id: 1, sort_order: 1 });
carImageSchema.index({ car_id: 1, sub_category_id: 1, sort_order: 1 });
carImageSchema.index({ category_id: 1, sub_category_id: 1 });
carImageSchema.index({ tags: 1 });
carImageSchema.index({ is_published: 1, is_deleted: 1 });
carImageSchema.index({ status: 1 });

// Unique primary per car (non-deleted)
carImageSchema.index(
  { car_id: 1, is_primary: 1 },
  {
    unique: true,
    partialFilterExpression: { is_primary: true, is_deleted: false },
  }
);

export const CarImage = model<ICarImage>('CarImage', carImageSchema);
