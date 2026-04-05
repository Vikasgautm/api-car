export declare class CityService {
    static getAllCities(query: any): Promise<{
        cities: (import("mongoose").Document<unknown, {}, import("../../../models/city.model").ICity, {}, import("mongoose").DefaultSchemaOptions> & import("../../../models/city.model").ICity & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        })[];
        total: number;
        page: number;
        limit: number;
    }>;
    static updateCity(id: string, cityData: any): Promise<(import("mongoose").Document<unknown, {}, import("../../../models/city.model").ICity, {}, import("mongoose").DefaultSchemaOptions> & import("../../../models/city.model").ICity & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }) | null>;
    static deleteCity(id: string): Promise<(import("mongoose").Document<unknown, {}, import("../../../models/city.model").ICity, {}, import("mongoose").DefaultSchemaOptions> & import("../../../models/city.model").ICity & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }) | null>;
    static restoreCity(id: string): Promise<(import("mongoose").Document<unknown, {}, import("../../../models/city.model").ICity, {}, import("mongoose").DefaultSchemaOptions> & import("../../../models/city.model").ICity & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }) | null>;
    static createCity(cityData: any): Promise<import("mongoose").Document<unknown, {}, import("../../../models/city.model").ICity, {}, import("mongoose").DefaultSchemaOptions> & import("../../../models/city.model").ICity & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
}
//# sourceMappingURL=city.service.d.ts.map