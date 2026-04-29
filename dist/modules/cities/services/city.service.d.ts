import { ICity } from "../../../models/city.model";
export declare class CityService {
    static getAllCities(filterDto: any, includeDeleted?: boolean): Promise<{
        cities: (import("mongoose").Document<unknown, {}, ICity, {}, import("mongoose").DefaultSchemaOptions> & ICity & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        })[];
        pagination: import("../../../shared/interfaces/pagination-response.interface").PaginationMeta;
    }>;
    static getCityById(cityId: string): Promise<(import("mongoose").Document<unknown, {}, ICity, {}, import("mongoose").DefaultSchemaOptions> & ICity & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }) | null>;
    static getCityBySlug(slug: string): Promise<(import("mongoose").Document<unknown, {}, ICity, {}, import("mongoose").DefaultSchemaOptions> & ICity & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }) | null>;
    static createCity(cityData: any): Promise<import("mongoose").Document<unknown, {}, ICity, {}, import("mongoose").DefaultSchemaOptions> & ICity & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    static updateCity(cityId: string, cityData: any): Promise<import("mongoose").Document<unknown, {}, ICity, {}, import("mongoose").DefaultSchemaOptions> & ICity & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    static deleteCity(cityId: string): Promise<import("mongoose").Document<unknown, {}, ICity, {}, import("mongoose").DefaultSchemaOptions> & ICity & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    static restoreCity(cityId: string): Promise<import("mongoose").Document<unknown, {}, ICity, {}, import("mongoose").DefaultSchemaOptions> & ICity & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    static togglePublish(cityId: string): Promise<import("mongoose").Document<unknown, {}, ICity, {}, import("mongoose").DefaultSchemaOptions> & ICity & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
}
//# sourceMappingURL=city.service.d.ts.map