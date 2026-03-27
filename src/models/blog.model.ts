import { Schema, model, Document } from "mongoose";

export interface IBlog extends Document {
  blog_id: string;
  title: string;
  content: string;
  excerpt: string;
  author: string;
  slug: string;
  link?: string;
  thumbnail: {
    preview: string;
    title: string;
    url: string;
  };
  is_published: boolean;
  is_deleted: boolean;
}

const blogSchema = new Schema<IBlog>(
  {
    blog_id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    excerpt: {
      type: String,
      maxlength: [300, "Excerpt cannot be more than 300 characters"],
    },
    author: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    link: { type: String },
    thumbnail: {
      type: {
        preview: { type: String },
        title: { type: String },
        url: { type: String },
      },
      required: true,
    },
    is_published: { type: Boolean, default: false },
    is_deleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const Blog = model<IBlog>("Blog", blogSchema);
