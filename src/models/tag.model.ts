import { Document, Schema, model } from 'mongoose';

export interface ITag extends Document {
  tag_id: string;
  tag_category_id: string;
  name: string;
  slug: string;
  description?: string;
  seo_meta?: {
    title?: string;
    description?: string;
    h1?: string;
  };
  is_published: boolean;
  is_deleted: boolean;
  sort_order: number;
}

const tagSchema = new Schema<ITag>(
  {
    tag_id: { type: String, required: true, unique: true },
    tag_category_id: { type: String, required: true },
    name: { type: String, required: true },
    slug: { type: String, required: true },
    description: { type: String },
    seo_meta: {
      title: { type: String },
      description: { type: String, maxlength: 160 },
      h1: { type: String },
    },
    is_published: { type: Boolean, default: true },
    is_deleted: { type: Boolean, default: false },
    sort_order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

tagSchema.index({ tag_category_id: 1 });
tagSchema.index({ slug: 1 }, { unique: true });
tagSchema.index({ tag_category_id: 1, slug: 1 });
tagSchema.index({ is_published: 1, is_deleted: 1 });
tagSchema.index({ name: 'text' });

export const Tag = model<ITag>('Tag', tagSchema);
