import { Document, Schema } from 'mongoose';
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
    meta_title?: string;
    meta_description?: string;
    meta_keywords?: string;
    og_image?: string;
    canonical_url?: string;
    noindex?: boolean;
}
export declare const Blog: import("mongoose").Model<IBlog, {}, {}, {}, Document<unknown, {}, IBlog, {}, import("mongoose").DefaultSchemaOptions> & IBlog & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IBlog>;
//# sourceMappingURL=blog.model.d.ts.map