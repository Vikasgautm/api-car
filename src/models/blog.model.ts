import { Document, Schema, model } from 'mongoose';

export interface IBlog extends Document {
  blog_id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author_name?: string;
  author_id?: Schema.Types.ObjectId;
  category: string;
  tags?: string[];
  thumbnail?: {
    url: string;
    alt?: string;
  };
  images?: Array<{
    url: string;
    alt?: string;
  }>;
  link?: string;
  is_published: boolean;
  is_deleted: boolean;
  is_featured?: boolean;
  // SEO fields
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  og_image?: string;
  canonical_url?: string;
  noindex?: boolean;
}

const blogSchema = new Schema<IBlog>(
  {
    blog_id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    excerpt: { type: String, required: true, maxlength: 8000 },
    content: { type: String, required: true },
    author_name: { type: String },
    author_id: { type: Schema.Types.ObjectId, ref: 'User' },
    category: { type: String, required: true },
    tags: [{ type: String }],
    thumbnail: {
      url: { type: String },
      alt: { type: String },
    },
    images: [{
      url: { type: String },
      alt: { type: String },
    }],
    link: { type: String },
    is_published: { type: Boolean, default: false },
    is_deleted: { type: Boolean, default: false },
    is_featured: { type: Boolean, default: false },
    // SEO fields
    meta_title: { type: String },
    meta_description: { type: String, maxlength: 160 },
    meta_keywords: { type: String },
    og_image: { type: String },
    canonical_url: { type: String },
    noindex: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

blogSchema.index({ author_id: 1 });
blogSchema.index({ author_name: 1 });
blogSchema.index({ category: 1 });
blogSchema.index({ tags: 1 });
blogSchema.index({ is_published: 1, is_deleted: 1 });
blogSchema.index({ is_featured: 1 });
blogSchema.index({ title: 'text', content: 'text', excerpt: 'text' });

export const Blog = model<IBlog>('Blog', blogSchema);
