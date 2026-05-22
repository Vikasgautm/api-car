import { IBrandAggregatesCache } from '../../models/brand.model';
export declare class BrandAggregationService {
    static computeAndCache(brandId: string): Promise<IBrandAggregatesCache | null>;
    static refreshAll(): Promise<{
        processed: number;
        errors: number;
    }>;
}
//# sourceMappingURL=brand-aggregation.service.d.ts.map