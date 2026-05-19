import mongoose, { Schema, Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export interface IComparison extends Document {
  comparison_id: string;
  car1_id: string;
  car2_id: string;
  variant1_id?: string;
  variant2_id?: string;
  slug: string;
  title: string;
  category?: string;
  description?: string;
  compareIntroContent?: string;
  isPopular: boolean;
  isTrending: boolean;
  showOnHomepage: boolean;
  relatedComparisons: string[];
  seoMetaTitle?: string;
  seoMetaDescription?: string;
  seoFAQSchema?: Record<string, any>;
  status: 'draft' | 'published' | 'archived';
  is_published: boolean;
  created_by: string;
  updated_by?: string;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
  is_deleted: boolean;
}

const ComparisonSchema: Schema<IComparison> = new Schema(
  {
    comparison_id: {
      type: String,
      default: () => uuidv4(),
      unique: true,
      index: true,
    },
    car1_id: {
      type: String,
      required: true,
      index: true,
    },
    car2_id: {
      type: String,
      required: true,
      index: true,
    },
    variant1_id: {
      type: String,
      index: true,
    },
    variant2_id: {
      type: String,
      index: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ['suv', 'sedan', 'hatchback', 'coupe', 'mpv', 'ev', 'luxury', 'budget', 'mid_range'],
      index: true,
    },
    description: String,
    compareIntroContent: String,
    isPopular: {
      type: Boolean,
      default: false,
      index: true,
    },
    isTrending: {
      type: Boolean,
      default: false,
      index: true,
    },
    showOnHomepage: {
      type: Boolean,
      default: false,
      index: true,
    },
    relatedComparisons: [{
      type: String,
    }],
    seoMetaTitle: String,
    seoMetaDescription: String,
    seoFAQSchema: mongoose.Schema.Types.Mixed,
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
      index: true,
    },
    is_published: {
      type: Boolean,
      default: false,
      index: true,
    },
    created_by: {
      type: String,
      required: true,
    },
    updated_by: {
      type: String,
    },
    is_deleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deleted_at: Date,
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  },
);

// Indexes for performance
ComparisonSchema.index({ status: 1, is_published: 1 });
ComparisonSchema.index({ isPopular: 1, status: 1 });
ComparisonSchema.index({ category: 1, status: 1 });
// Note: slug index already defined via 'index: true' in schema property above
ComparisonSchema.index({ car1_id: 1, car2_id: 1 });
// Note: is_deleted index already defined via 'index: true' in schema property above

export const Comparison = mongoose.model<IComparison>('Comparison', ComparisonSchema);
