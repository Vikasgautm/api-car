import { Document, Schema, model } from 'mongoose';

export enum FAQCategory {
  GENERAL = 'General',
  BUYING_GUIDE = 'Buying Guide',
  MAINTENANCE = 'Maintenance',
  COMPARISON = 'Comparison',
  FINANCING = 'Financing',
  DOCUMENTATION = 'Documentation',
  TECHNICAL = 'Technical',
  OTHER = 'Other',
}

export enum AnswerFormat {
  TEXT = 'text',
  HTML = 'html',
  MARKDOWN = 'markdown',
}

export interface IFAQ extends Document {
  faq_id: string;
  question: string;
  answer: string;
  category: FAQCategory;
  order: number;
  tags: string[];
  answer_format: AnswerFormat;
  view_count: number;
  faq_group?: string;
  related_cars: string[];
  related_brands: string[];
  related_blogs: string[];
  is_published: boolean;
  is_deleted: boolean;
  is_featured: boolean;
  slug: string;
}

const faqSchema = new Schema<IFAQ>(
  {
    faq_id: { type: String, required: true, unique: true },
    question: { type: String, required: true },
    answer: { type: String, required: true },
    category: {
      type: String,
      required: true,
      enum: Object.values(FAQCategory),
      default: FAQCategory.GENERAL,
    },
    order: { type: Number, default: 0 },
    tags: [{ type: String }],
    answer_format: {
      type: String,
      enum: Object.values(AnswerFormat),
      default: AnswerFormat.TEXT,
    },
    view_count: { type: Number, default: 0 },
    faq_group: { type: String },
    related_cars: [{ type: String }],
    related_brands: [{ type: String }],
    related_blogs: [{ type: String }],
    is_published: { type: Boolean, default: false },
    is_deleted: { type: Boolean, default: false },
    is_featured: { type: Boolean, default: false },
    slug: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

faqSchema.index({ category: 1 });
faqSchema.index({ order: 1 });
faqSchema.index({ tags: 1 });
faqSchema.index({ faq_group: 1 });
faqSchema.index({ is_featured: 1 });

export const FAQ = model<IFAQ>('FAQ', faqSchema);
