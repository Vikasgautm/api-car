import { Document, Schema, model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export interface IImage extends Document {
  image_id: string;
  url: string;
  public_id?: string;
  original_name: string;
  mime_type: string;
  size: number;
  folder?: string;
  alt_text?: string;
  caption?: string;
  tags?: string[];
  uploaded_by?: string;
  is_published: boolean;
  is_deleted: boolean;
  metadata?: Record<string, any>;
}

const imageSchema = new Schema<IImage>(
  {image_id: { type: String, required: true, unique: true, default: () => uuidv4() },
    
    url: { type: String, required: true },
    public_id: { type: String, index: true },
    original_name: { type: String, required: true },
    mime_type: { type: String, required: true },
    size: { type: Number, required: true },
    folder: { type: String },
    alt_text: { type: String },
    caption: { type: String },
    tags: { type: [String] },
    uploaded_by: { type: String },
    is_published: { type: Boolean, default: false },
    is_deleted: { type: Boolean, default: false, index: true },
    metadata: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
  }
);

imageSchema.index({ folder: 1, is_deleted: 1 });
imageSchema.index({ uploaded_by: 1, is_deleted: 1 });
imageSchema.index({ mime_type: 1 });
imageSchema.index({ tags: 1 });
imageSchema.index({ is_published: 1, is_deleted: 1 });

export const Image = model<IImage>('Image', imageSchema);
