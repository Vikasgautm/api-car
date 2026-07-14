import { ISeoCollection } from '../../../models/seo-collection.model';
export declare class SeoCollectionService {
    static list(params: {
        page?: number;
        limit?: number;
        q?: string;
        collection_type?: string;
        status?: string;
        seo_index_status?: string;
        include_deleted?: boolean | string;
    }): Promise<{
        collections: (ISeoCollection & import("../../../sql/common/BaseModel").SQLDocument)[];
        pagination: import("../../../shared/interfaces/pagination-response.interface").PaginationMeta;
    }>;
    static getById(collection_id: string): Promise<ISeoCollection & import("../../../sql/common/BaseModel").SQLDocument>;
    static getBySlug(slug: string): Promise<(ISeoCollection & import("../../../sql/common/BaseModel").SQLDocument) | null>;
    static create(data: any, userId?: string): Promise<any>;
    static update(collection_id: string, data: any, userId?: string): Promise<(ISeoCollection & import("../../../sql/common/BaseModel").SQLDocument) | null>;
    static softDelete(collection_id: string): Promise<ISeoCollection & import("../../../sql/common/BaseModel").SQLDocument>;
    static refresh(collection_id: string): Promise<(ISeoCollection & import("../../../sql/common/BaseModel").SQLDocument) | null>;
    static hydrate(slug: string, page?: number): Promise<{
        cars: (import("../../../models/car.model").ICar & import("../../../sql/common/BaseModel").SQLDocument)[];
        pagination: import("../../../shared/interfaces/pagination-response.interface").PaginationMeta;
        facets: import("../../discovery/services/discovery.service").DiscoveryFacets;
        applied: import("../../discovery/services/discovery.service").ResolvedFilters;
        collection: ISeoCollection & import("../../../sql/common/BaseModel").SQLDocument;
    }>;
    static generateContent(collection_id: string): Promise<(ISeoCollection & import("../../../sql/common/BaseModel").SQLDocument) | null>;
    static getHealth(params: {
        page?: number;
        limit?: number;
        issue_type?: string;
    }): Promise<{
        collections: (ISeoCollection & import("../../../sql/common/BaseModel").SQLDocument)[];
        pagination: import("../../../shared/interfaces/pagination-response.interface").PaginationMeta;
    }>;
    static getHealthSummary(): Promise<{
        total: number;
        noindex: number;
        low_count: number;
        low_health: number;
        duplicate: number;
        stale: number;
    }>;
    static previewQuery(data: any): Promise<{
        cars: (import("../../../models/car.model").ICar & import("../../../sql/common/BaseModel").SQLDocument)[];
        pagination: import("../../../shared/interfaces/pagination-response.interface").PaginationMeta;
        facets: import("../../discovery/services/discovery.service").DiscoveryFacets;
        applied: import("../../discovery/services/discovery.service").ResolvedFilters;
    }>;
    private static _refreshRelated;
}
