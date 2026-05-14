import { ISeoPreset } from '../../../models/seo-preset.model';
export declare class SeoPresetService {
    static list(params: {
        page?: number;
        limit?: number;
        q?: string;
        is_published?: boolean;
        include_deleted?: boolean;
    }): Promise<{
        presets: (ISeoPreset & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
        pagination: import("../../../shared/interfaces/pagination-response.interface").PaginationMeta;
    }>;
    static getById(presetId: string): Promise<(ISeoPreset & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }) | null>;
    static getBySlug(slug: string): Promise<(ISeoPreset & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }) | null>;
    static create(data: any): Promise<ISeoPreset>;
    static update(presetId: string, data: any): Promise<import("mongoose").Document<unknown, {}, ISeoPreset, {}, import("mongoose").DefaultSchemaOptions> & ISeoPreset & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    static softDelete(presetId: string): Promise<import("mongoose").Document<unknown, {}, ISeoPreset, {}, import("mongoose").DefaultSchemaOptions> & ISeoPreset & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    /**
     * Hydrate a preset: return the preset itself plus the discovery results when
     * its query_params are applied. Used by the public landing page route.
     */
    static hydrate(slug: string, overridePage?: number | string): Promise<{
        cars: (import("../../../models/car.model").ICar & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
        pagination: import("../../../shared/interfaces/pagination-response.interface").PaginationMeta;
        facets: import("./discovery.service").DiscoveryFacets;
        applied: import("./discovery.service").ResolvedFilters;
        preset: ISeoPreset & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        };
    }>;
}
//# sourceMappingURL=seo-preset.service.d.ts.map