import { Schema, model, Document } from 'mongoose';

export interface IBodyType extends Document {
  body_type_id: string;
  name: string;
  slug: string;
  description?: string;
  is_deleted: boolean;
}

const bodyTypeSchema = new Schema<IBodyType>(
  {
    body_type_id: { type: String, unique: true, required: true },
    name: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String },
    is_deleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const BodyType = model<IBodyType>('BodyType', bodyTypeSchema);
