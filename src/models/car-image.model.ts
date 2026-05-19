import { Document, Schema, model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export interface ICarImage extends Document {
  car_image_id: string;
  image_uuid?: string;
  car_id: string;
  variant_id?: string;
  category_id?: string;
  sub_category_id?: string;
  url: string;
  thumbnail_url?: string;
  alt_text?: string;
  caption?: string;
  tags?: string[];
  sort_order: number;
  display_order?: number;
  is_primary: boolean;
  is_published: boolean;
  is_deleted: boolean;
  source?: string;
  car_condition?: string;
  taken_at?: Date;
  uploaded_by?: string;
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
      required: true
    },
    image_uuid: { type: String, sparse: true },
    car_id: { type: String, required: true },
    variant_id: { type: String },
    category_id: { type: String },
    sub_category_id: { type: String },
    url: { type: String, required: true },
    thumbnail_url: { type: String },
    alt_text: { type: String },
    caption: { type: String },
    tags: { type: [String] },
    sort_order: { type: Number, default: 0 },
    display_order: { type: Number, default: 0 },
    is_primary: { type: Boolean, default: false },
    is_published: { type: Boolean, default: false },
    is_deleted: { type: Boolean, default: false },
    source: { type: String },
    car_condition: { type: String },
    taken_at: { type: Date },
    uploaded_by: { type: String },
    damage_area: { type: String },
    damage_note: { type: String },
    inspection_severity: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
  }
);

carImageSchema.index({ car_id: 1, category_id: 1, sort_order: 1 });
carImageSchema.index({ car_id: 1, sub_category_id: 1, sort_order: 1 });
carImageSchema.index({ car_id: 1, is_primary: 1, is_deleted: 1 });
carImageSchema.index({ variant_id: 1, is_deleted: 1 });
carImageSchema.index({ category_id: 1, sub_category_id: 1 });
carImageSchema.index({ tags: 1 });
carImageSchema.index({ is_published: 1, is_deleted: 1 });
carImageSchema.index({ sort_order: 1 });

carImageSchema.index(
  { car_id: 1, is_primary: 1 },
  {
    unique: true,
    partialFilterExpression: {
      is_primary: true,
      is_deleted: false,
    },
  }
);

export const CarImage = model<ICarImage>('CarImage', carImageSchema);