import { Document, Schema, model } from 'mongoose';

export interface IBodyType extends Document {
  body_type_id: string;
  name: string;
  slug: string;
  description?: string;
  is_published: boolean;
  is_deleted: boolean;
  is_featured?: boolean;
  logo?: {
    title?: string;
    url: string;
  };
}

const bodyTypeSchema = new Schema<IBodyType>(
  {
    body_type_id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String },
    is_published: { type: Boolean, default: false },
    is_deleted: { type: Boolean, default: false },
    is_featured: { type: Boolean, default: false },
    logo: {
      title: { type: String },
      url: { type: String },
    },
  },
  {
    timestamps: true,
  }
);

bodyTypeSchema.index({ is_deleted: 1 });
bodyTypeSchema.index({ is_published: 1 });
bodyTypeSchema.index({ is_published: 1, is_deleted: 1 });
bodyTypeSchema.index({ is_featured: 1 });
bodyTypeSchema.index({ name: 'text' });

export const BodyType = model<IBodyType>('BodyType', bodyTypeSchema);
