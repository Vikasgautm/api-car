export declare class CarCompareService {
    static getAllComparisons(query: any, fetchAsAdmin?: boolean): Promise<{
        comparisons: (import("mongoose").Document<unknown, {}, import("../../../models/car-compare.model").ICarCompare, {}, import("mongoose").DefaultSchemaOptions> & import("../../../models/car-compare.model").ICarCompare & Required<{
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
    static getComparisonByRoute(route: string): Promise<(import("mongoose").Document<unknown, {}, import("../../../models/car-compare.model").ICarCompare, {}, import("mongoose").DefaultSchemaOptions> & import("../../../models/car-compare.model").ICarCompare & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }) | null>;
    static updateComparison(id: string, compareData: any): Promise<(import("mongoose").Document<unknown, {}, import("../../../models/car-compare.model").ICarCompare, {}, import("mongoose").DefaultSchemaOptions> & import("../../../models/car-compare.model").ICarCompare & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }) | null>;
    static deleteComparison(id: string): Promise<(import("mongoose").Document<unknown, {}, import("../../../models/car-compare.model").ICarCompare, {}, import("mongoose").DefaultSchemaOptions> & import("../../../models/car-compare.model").ICarCompare & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }) | null>;
    static restoreComparison(id: string): Promise<(import("mongoose").Document<unknown, {}, import("../../../models/car-compare.model").ICarCompare, {}, import("mongoose").DefaultSchemaOptions> & import("../../../models/car-compare.model").ICarCompare & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }) | null>;
    static createComparison(compareData: any): Promise<import("mongoose").Document<unknown, {}, import("../../../models/car-compare.model").ICarCompare, {}, import("mongoose").DefaultSchemaOptions> & import("../../../models/car-compare.model").ICarCompare & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
}
//# sourceMappingURL=car-compare.service.d.ts.map