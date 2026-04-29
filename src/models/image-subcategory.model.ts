import { Document, Schema, model } from 'mongoose';

export interface IImageSubCategory extends Document {
  category_id: Schema.Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  is_active: boolean;
  display_order: number;
  is_deleted?: boolean;
  deleted_at?: Date;
}

const imageSubCategorySchema = new Schema<IImageSubCategory>(
  {
    category_id: { type: Schema.Types.ObjectId, ref: 'ImageCategory', required: true },
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

imageSubCategorySchema.index({ category_id: 1 });
imageSubCategorySchema.index({ is_active: 1 });
imageSubCategorySchema.index({ display_order: 1 });
imageSubCategorySchema.index({ category_id: 1, is_active: 1, display_order: 1 });

export const ImageSubCategory = model<IImageSubCategory>('ImageSubCategory', imageSubCategorySchema);