import { Document, Schema, model } from 'mongoose';

export interface ITagCategory extends Document {
  tag_category_id: string;
  name: string;
  slug: string;
  type: string;
  description?: string;
  is_published: boolean;
  is_deleted: boolean;
  sort_order: number;
}

const tagCategorySchema = new Schema<ITagCategory>(
  {
    tag_category_id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    type: { type: String, required: true, default: 'intent' },
    description: { type: String },
    is_published: { type: Boolean, default: true },
    is_deleted: { type: Boolean, default: false },
    sort_order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

tagCategorySchema.index({ type: 1 });
tagCategorySchema.index({ is_published: 1, is_deleted: 1 });
tagCategorySchema.index({ name: 'text' });

export const TagCategory = model<ITagCategory>('TagCategory', tagCategorySchema);
