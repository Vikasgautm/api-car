import { IBlog } from "../../../models/blog.model";
export declare class BlogService {
    static getAllBlogs(filterDto: any, includeDeleted?: boolean): Promise<{
        blogs: (IBlog & import("../../../sql/common/BaseModel").SQLDocument)[];
        pagination: import("../../../shared/interfaces/pagination-response.interface").PaginationMeta;
    }>;
    static getBlogById(blogId: string): Promise<(IBlog & import("../../../sql/common/BaseModel").SQLDocument) | null>;
    static getBlogBySlug(slug: string): Promise<(IBlog & import("../../../sql/common/BaseModel").SQLDocument) | null>;
    static findBlogById(id: string): Promise<(IBlog & import("../../../sql/common/BaseModel").SQLDocument) | null>;
    static createBlog(blogData: any): Promise<any>;
    static updateBlog(blogId: string, blogData: any): Promise<IBlog & import("../../../sql/common/BaseModel").SQLDocument>;
    static deleteBlog(blogId: string): Promise<IBlog & import("../../../sql/common/BaseModel").SQLDocument>;
    static restoreBlog(blogId: string): Promise<IBlog & import("../../../sql/common/BaseModel").SQLDocument>;
    static togglePublish(blogId: string): Promise<IBlog & import("../../../sql/common/BaseModel").SQLDocument>;
}
