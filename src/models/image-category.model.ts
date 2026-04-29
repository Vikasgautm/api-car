import { Document, Schema, model } from 'mongoose';

export interface IImageCategory extends Document {
  name: string;
  slug: string;
  description?: string;
  is_active: boolean;
  display_order: number;
  is_deleted?: boolean;
  deleted_at?: Date;
}

const imageCategorySchema = new Schema<IImageCategory>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String },
    is_active: { type: Boolean, default: true },
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
imageCategorySchema.index({ display_order: 1 });
imageCategorySchema.index({ is_active: 1, display_order: 1 });

export const ImageCategory = model<IImageCategory>('ImageCategory', imageCategorySchema);