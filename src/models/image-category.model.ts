import { Document, Schema, model } from 'mongoose';

export interface IImageCategory extends Document {
  category_id: string;
  name: string;
  slug: string;
  description?: string;
  is_active: boolean;
  is_published: boolean;
  sort_order: number;
  display_order?: number;
  is_deleted?: boolean;
  deleted_at?: Date;
}

const imageCategorySchema = new Schema<IImageCategory>(
  {
    category_id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String },
    is_active: { type: Boolean, default: true },
    is_published: { type: Boolean, default: true },
    sort_order: { type: Number, default: 0 },
    display_order: { type: Number, default: 0 },
    is_deleted: { type: Boolean, default: false },
    deleted_at: { type: Date },
  },
  {
    timestamps: true,
  }
);

imageCategorySchema.index({ name: 1 });
imageCategorySchema.index({ is_active: 1 });
imageCategorySchema.index({ is_published: 1 });
imageCategorySchema.index({ sort_order: 1 });
imageCategorySchema.index({ is_active: 1, sort_order: 1 });
imageCategorySchema.index({ is_published: 1, sort_order: 1 });

export const ImageCategory = model<IImageCategory>('ImageCategory', imageCategorySchema);