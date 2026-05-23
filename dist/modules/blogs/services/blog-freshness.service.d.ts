export declare class BlogFreshnessService {
    static checkBlog(blogId: string): Promise<{
        blog_id: string;
        freshness_score: number;
        stale_flags: string[];
        article_status: string | undefined;
    }>;
    static runBulkFreshnessCheck(limit?: number): Promise<{
        processed: number;
        succeeded: number;
        stale: number;
    }>;
}
//# sourceMappingURL=blog-freshness.service.d.ts.map