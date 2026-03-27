import { Schema, model, Document } from 'mongoose';

export interface IFAQ extends Document {
  faq_id: string;
  question: string;
  answer: string;
  category?: string;
  related_blog?: string;
  is_published: boolean;
  is_deleted: boolean;
  car_id?: string;
}

const faqSchema = new Schema<IFAQ>(
  {
    faq_id: { type: String, required: true, unique: true },
    question: { type: String, required: true },
    answer: { type: String, required: true },
    category: { type: String },
    related_blog: { type: String, ref: 'Blog' },
    is_published: { type: Boolean, default: false },
    is_deleted: { type: Boolean, default: false },
    car_id: { type: String, ref: 'Car' },
  },
  { timestamps: true }
);

export const FAQ = model<IFAQ>('FAQ', faqSchema);
