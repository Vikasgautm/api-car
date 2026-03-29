import { Document } from "mongoose";
export interface IBlog extends Document {
    blog_id: string;
    title: string;
    content: string;
    excerpt: string;
    author: string;
    slug: string;
    category: string;
    link?: string;
    thumbnail: {
        preview: string;
        title: string;
        url: string;
    };
    is_published: boolean;
    is_deleted: boolean;
}
export declare const Blog: import("mongoose").Model<IBlog, {}, {}, {}, Document<unknown, {}, IBlog, {}, import("mongoose").DefaultSchemaOptions> & IBlog & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IBlog>;
//# sourceMappingURL=blog.model.d.ts.map