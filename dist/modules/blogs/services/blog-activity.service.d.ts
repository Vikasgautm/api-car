export declare class BlogActivityService {
    static getRecentActivity(limit?: number): Promise<any[]>;
    static getStaleAlerts(limit?: number): Promise<(import("../../../models/blog.model").IBlog & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    static getContentHealthSummary(): Promise<{
        total: number;
        published: number;
        drafts: number;
        stale: number;
        orphaned: number;
        missing_meta: number;
        avg_seo_score: number | null;
    }>;
    static getEntityImpactAlerts(): Promise<{
        blog_id: any;
        title: any;
        connected_cars_count: any;
        connected_brands_count: any;
        stale_flags: any;
        message: string;
    }[]>;
}
//# sourceMappingURL=blog-activity.service.d.ts.map