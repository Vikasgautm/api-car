import { ISeoPreset } from '../../../models/seo-preset.model';
export declare class SeoPresetService {
    static list(params: {
        page?: number;
        limit?: number;
        q?: string;
        is_published?: boolean;
        include_deleted?: boolean;
    }): Promise<{
        presets: (ISeoPreset & import("../../../sql/common/BaseModel").SQLDocument)[];
        pagination: import("../../../shared/interfaces/pagination-response.interface").PaginationMeta;
    }>;
    static getById(presetId: string): Promise<(ISeoPreset & import("../../../sql/common/BaseModel").SQLDocument) | null>;
    static getBySlug(slug: string): Promise<(ISeoPreset & import("../../../sql/common/BaseModel").SQLDocument) | null>;
    static create(data: any): Promise<ISeoPreset>;
    static update(presetId: string, data: any): Promise<ISeoPreset & import("../../../sql/common/BaseModel").SQLDocument>;
    static softDelete(presetId: string): Promise<ISeoPreset & import("../../../sql/common/BaseModel").SQLDocument>;
    /**
     * Hydrate a preset: return the preset itself plus the discovery results when
     * its query_params are applied. Used by the public landing page route.
     */
    static hydrate(slug: string, overridePage?: number | string): Promise<{
        cars: (import("../../../models/car.model").ICar & import("../../../sql/common/BaseModel").SQLDocument)[];
        pagination: import("../../../shared/interfaces/pagination-response.interface").PaginationMeta;
        facets: import("./discovery.service").DiscoveryFacets;
        applied: import("./discovery.service").ResolvedFilters;
        preset: ISeoPreset & import("../../../sql/common/BaseModel").SQLDocument;
    }>;
}
