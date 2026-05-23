export declare class BlogRelatedService {
    static getRelatedArticles(blogId: string, limit?: number): Promise<(import("../../../models/blog.model").IBlog & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
}
//# sourceMappingURL=blog-related.service.d.ts.map