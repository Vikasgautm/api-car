export interface FAQHealthResult {
    faq_id: string;
    faq_health_score: number;
    freshness_score: number;
    needs_refresh: boolean;
    flags: string[];
}
export declare class FAQHealthService {
    /**
     * Compute and persist faq_health_score, freshness_score and needs_refresh for a
     * single FAQ. Mirrors BlogFreshnessService.checkBlog: scores are derived from
     * deterministic heuristics (the same ones the content-health checker reports on)
     * and written back so the Review Queue and relevance ranking have real signals.
     */
    static checkFaq(faqId: string): Promise<FAQHealthResult>;
    /**
     * Recompute health for a batch of non-deleted FAQs. Admin-triggered, mirroring
     * BlogFreshnessService.runBulkFreshnessCheck.
     */
    static runBulkHealthCheck(limit?: number): Promise<{
        processed: number;
        succeeded: number;
        needs_refresh: number;
    }>;
}
//# sourceMappingURL=faq-health.service.d.ts.map