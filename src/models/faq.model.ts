import { Document, Schema, model } from 'mongoose';

export type AnswerFormat = 'text' | 'html' | 'markdown';

export interface IFAQ extends Document {
  faq_id: string;
  question: string;
  answer: string;
  category: string;
  order: number;
  tags?: string[];
  answer_format: AnswerFormat;
  faq_group?: string;
  related_cars?: Schema.Types.ObjectId[];
  related_brands?: Schema.Types.ObjectId[];
  related_blogs?: Schema.Types.ObjectId[];
  is_published: boolean;
  is_deleted: boolean;
  is_featured: boolean;
  slug: string;
  view_count?: number;
}

const faqSchema = new Schema<IFAQ>(
  {
    faq_id: { type: String, required: true, unique: true },
    question: { type: String, required: true },
    answer: { type: String, required: true },
    category: { type: String, required: true },
    order: { type: Number, default: 0 },
    tags: { type: [String] },
    answer_format: { 
      type: String, 
      enum: ['text', 'html', 'markdown'],
      default: 'text'
    },
    faq_group: { type: String },
    related_cars: [{ type: Schema.Types.ObjectId, ref: 'Car' }],
    related_brands: [{ type: Schema.Types.ObjectId, ref: 'Brand' }],
    related_blogs: [{ type: Schema.Types.ObjectId, ref: 'Blog' }],
    is_published: { type: Boolean, default: false },
    is_deleted: { type: Boolean, default: false },
    is_featured: { type: Boolean, default: false },
    slug: { type: String, required: true, unique: true },
    view_count: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

faqSchema.index({ category: 1 });
faqSchema.index({ tags: 1 });
faqSchema.index({ faq_group: 1 });
faqSchema.index({ is_published: 1, is_deleted: 1 });
faqSchema.index({ question: 'text', answer: 'text' });
faqSchema.index({ is_featured: 1 });
faqSchema.index({ order: 1 });
faqSchema.index({ view_count: -1 });
faqSchema.index({ is_published: 1, is_deleted: 1, is_featured: 1 });
faqSchema.index({ faq_group: 1, is_published: 1, is_deleted: 1, order: 1 });

export const FAQ = model<IFAQ>('FAQ', faqSchema);
