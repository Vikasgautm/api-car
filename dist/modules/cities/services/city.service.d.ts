import { ICity } from "../../../models/city.model";
export declare class CityService {
    static getAllCities(filterDto: any, includeDeleted?: boolean): Promise<{
        cities: (ICity & import("../../../sql/common/BaseModel").SQLDocument)[];
        pagination: import("../../../shared/interfaces/pagination-response.interface").PaginationMeta;
    }>;
    static getCityById(cityId: string): Promise<(ICity & import("../../../sql/common/BaseModel").SQLDocument) | null>;
    static getCityBySlug(slug: string): Promise<(ICity & import("../../../sql/common/BaseModel").SQLDocument) | null>;
    static createCity(cityData: any): Promise<any>;
    static updateCity(cityId: string, cityData: any): Promise<ICity & import("../../../sql/common/BaseModel").SQLDocument>;
    static deleteCity(cityId: string): Promise<ICity & import("../../../sql/common/BaseModel").SQLDocument>;
    static bulkSeedCities(): Promise<{
        inserted: number;
        skipped: number;
    }>;
    static restoreCity(cityId: string): Promise<ICity & import("../../../sql/common/BaseModel").SQLDocument>;
}
