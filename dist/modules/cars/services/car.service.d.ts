export declare class CarService {
    static getAllCars(query: any, fetchAsAdmin?: boolean): Promise<{
        cars: (import("mongoose").Document<unknown, {}, import("../../../models/car.model").ICar, {}, import("mongoose").DefaultSchemaOptions> & import("../../../models/car.model").ICar & Required<{
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
    static getCarBySlug(slug: string): Promise<{
        car: import("mongoose").Document<unknown, {}, import("../../../models/car.model").ICar, {}, import("mongoose").DefaultSchemaOptions> & import("../../../models/car.model").ICar & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        };
        variants: (import("mongoose").Document<unknown, {}, import("../../../models/car-variant.model").ICarVariant, {}, import("mongoose").DefaultSchemaOptions> & import("../../../models/car-variant.model").ICarVariant & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        })[];
    } | null>;
    static createCar(carData: any): Promise<import("mongoose").Document<unknown, {}, import("../../../models/car.model").ICar, {}, import("mongoose").DefaultSchemaOptions> & import("../../../models/car.model").ICar & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    static updateCar(id: string, carData: any): Promise<(import("mongoose").Document<unknown, {}, import("../../../models/car.model").ICar, {}, import("mongoose").DefaultSchemaOptions> & import("../../../models/car.model").ICar & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }) | null>;
    static deleteCar(id: string): Promise<(import("mongoose").Document<unknown, {}, import("../../../models/car.model").ICar, {}, import("mongoose").DefaultSchemaOptions> & import("../../../models/car.model").ICar & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }) | null>;
    static restoreCar(id: string): Promise<(import("mongoose").Document<unknown, {}, import("../../../models/car.model").ICar, {}, import("mongoose").DefaultSchemaOptions> & import("../../../models/car.model").ICar & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }) | null>;
}
//# sourceMappingURL=car.service.d.ts.map