export declare class BlogRelatedService {
    static getRelatedArticles(blogId: string, limit?: number): Promise<(import("../../../models/blog.model").IBlog & import("../../../sql/common/BaseModel").SQLDocument)[]>;
}
