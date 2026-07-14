import { IBlog } from '../../../models/blog.model';
interface HealthCheck {
    code: string;
    label: string;
    passed: boolean;
    severity: 'critical' | 'high' | 'medium' | 'low';
}
interface BlogHealthResult {
    blog_id: string;
    title: string;
    slug: string;
    seo_health_score: number;
    checks: HealthCheck[];
    generated_at: string;
}
export declare class BlogHealthService {
    static runChecks(blog: Partial<IBlog>): HealthCheck[];
    static computeForBlog(blogId: string): Promise<BlogHealthResult>;
    static computeBulk(limit?: number): Promise<{
        processed: number;
        average_score: number;
    }>;
}
export {};
