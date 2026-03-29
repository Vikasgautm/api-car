export declare class BlogService {
    static getAllBlogs(query: any, isAdmin?: boolean): Promise<{
        blogs: (import("mongoose").Document<unknown, {}, import("../../../models/blog.model").IBlog, {}, import("mongoose").DefaultSchemaOptions> & import("../../../models/blog.model").IBlog & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        })[];
        total: number;
        page: number;
        limit: number;
    }>;
    static getBlogBySlug(slug: string): Promise<(import("mongoose").Document<unknown, {}, import("../../../models/blog.model").IBlog, {}, import("mongoose").DefaultSchemaOptions> & import("../../../models/blog.model").IBlog & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }) | null>;
    static findBlogById(id: string): Promise<(import("mongoose").Document<unknown, {}, import("../../../models/blog.model").IBlog, {}, import("mongoose").DefaultSchemaOptions> & import("../../../models/blog.model").IBlog & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }) | null>;
    static createBlog(blogData: any): Promise<import("mongoose").Document<unknown, {}, import("../../../models/blog.model").IBlog, {}, import("mongoose").DefaultSchemaOptions> & import("../../../models/blog.model").IBlog & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    static updateBlog(id: string, blogData: any): Promise<(import("mongoose").Document<unknown, {}, import("../../../models/blog.model").IBlog, {}, import("mongoose").DefaultSchemaOptions> & import("../../../models/blog.model").IBlog & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }) | null>;
    static deleteBlog(id: string): Promise<(import("mongoose").Document<unknown, {}, import("../../../models/blog.model").IBlog, {}, import("mongoose").DefaultSchemaOptions> & import("../../../models/blog.model").IBlog & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }) | null>;
}
//# sourceMappingURL=blog.service.d.ts.map