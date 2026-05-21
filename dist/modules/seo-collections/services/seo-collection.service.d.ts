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
        collections: (ISeoCollection & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
        pagination: import("../../../shared/interfaces/pagination-response.interface").PaginationMeta;
    }>;
    static getById(collection_id: string): Promise<ISeoCollection & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }>;
    static getBySlug(slug: string): Promise<(ISeoCollection & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }) | null>;
    static create(data: any, userId?: string): Promise<import("mongoose").Document<unknown, {}, ISeoCollection, {}, import("mongoose").DefaultSchemaOptions> & ISeoCollection & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    static update(collection_id: string, data: any, userId?: string): Promise<(ISeoCollection & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }) | null>;
    static softDelete(collection_id: string): Promise<import("mongoose").Document<unknown, {}, ISeoCollection, {}, import("mongoose").DefaultSchemaOptions> & ISeoCollection & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    static refresh(collection_id: string): Promise<(ISeoCollection & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }) | null>;
    static hydrate(slug: string, page?: number): Promise<{
        cars: (import("../../../models/car.model").ICar & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
        pagination: import("../../../shared/interfaces/pagination-response.interface").PaginationMeta;
        facets: import("../../discovery/services/discovery.service").DiscoveryFacets;
        applied: import("../../discovery/services/discovery.service").ResolvedFilters;
        collection: ISeoCollection & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        };
    }>;
    static generateContent(collection_id: string): Promise<(ISeoCollection & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }) | null>;
    static getHealth(params: {
        page?: number;
        limit?: number;
        issue_type?: string;
    }): Promise<{
        collections: (ISeoCollection & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
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
        cars: (import("../../../models/car.model").ICar & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
        pagination: import("../../../shared/interfaces/pagination-response.interface").PaginationMeta;
        facets: import("../../discovery/services/discovery.service").DiscoveryFacets;
        applied: import("../../discovery/services/discovery.service").ResolvedFilters;
    }>;
    private static _refreshRelated;
}
//# sourceMappingURL=seo-collection.service.d.ts.map