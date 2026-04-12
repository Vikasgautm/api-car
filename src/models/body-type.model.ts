import { Document, Schema, model } from 'mongoose';

export interface IBodyType extends Document {
  body_type_id: string;
  body_type_name: string;
  slug: string;
  description?: string;
  is_published: boolean;
  is_deleted: boolean;
}

const bodyTypeSchema = new Schema<IBodyType>(
  {
    body_type_id: { type: String, unique: true, required: true },
    body_type_name: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String },
    is_published: { type: Boolean, default: false },
    is_deleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const BodyType = model<IBodyType>('BodyType', bodyTypeSchema);
