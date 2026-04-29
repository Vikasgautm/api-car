import { IBlog } from "../../../models/blog.model";
export declare class BlogService {
    static getAllBlogs(filterDto: any, includeDeleted?: boolean): Promise<{
        blogs: (IBlog & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
        pagination: import("../../../shared/interfaces/pagination-response.interface").PaginationMeta;
    }>;
    static getBlogById(blogId: string): Promise<(import("mongoose").Document<unknown, {}, IBlog, {}, import("mongoose").DefaultSchemaOptions> & IBlog & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }) | null>;
    static getBlogBySlug(slug: string): Promise<(import("mongoose").Document<unknown, {}, IBlog, {}, import("mongoose").DefaultSchemaOptions> & IBlog & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }) | null>;
    static findBlogById(id: string): Promise<(import("mongoose").Document<unknown, {}, IBlog, {}, import("mongoose").DefaultSchemaOptions> & IBlog & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }) | null>;
    static createBlog(blogData: any): Promise<import("mongoose").Document<unknown, {}, IBlog, {}, import("mongoose").DefaultSchemaOptions> & IBlog & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    static updateBlog(blogId: string, blogData: any): Promise<import("mongoose").Document<unknown, {}, IBlog, {}, import("mongoose").DefaultSchemaOptions> & IBlog & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    static deleteBlog(blogId: string): Promise<import("mongoose").Document<unknown, {}, IBlog, {}, import("mongoose").DefaultSchemaOptions> & IBlog & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    static restoreBlog(blogId: string): Promise<import("mongoose").Document<unknown, {}, IBlog, {}, import("mongoose").DefaultSchemaOptions> & IBlog & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    static togglePublish(blogId: string): Promise<import("mongoose").Document<unknown, {}, IBlog, {}, import("mongoose").DefaultSchemaOptions> & IBlog & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
}
//# sourceMappingURL=blog.service.d.ts.map