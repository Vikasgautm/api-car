export declare class CarCompareService {
    static getAllComparisons(query: any): Promise<{
        comparisons: (import("mongoose").Document<unknown, {}, import("../../../models/car-compare.model").ICarCompare, {}, import("mongoose").DefaultSchemaOptions> & import("../../../models/car-compare.model").ICarCompare & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        })[];
        total: number;
        page: any;
        limit: any;
    }>;
    static getComparisonByRoute(route: string): Promise<(import("mongoose").Document<unknown, {}, import("../../../models/car-compare.model").ICarCompare, {}, import("mongoose").DefaultSchemaOptions> & import("../../../models/car-compare.model").ICarCompare & Required<{
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