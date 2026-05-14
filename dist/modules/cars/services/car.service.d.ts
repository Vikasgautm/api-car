import { ICar } from "../../../models/car.model";
import { AuditActor } from "../../../shared/utils/audit.util";
export declare class CarService {
    static getAllCars(filterDto: any, includeDeleted?: boolean): Promise<{
        cars: (ICar & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
        pagination: import("../../../shared/interfaces/pagination-response.interface").PaginationMeta;
    }>;
    static getCarById(carId: string): Promise<(import("mongoose").Document<unknown, {}, ICar, {}, import("mongoose").DefaultSchemaOptions> & ICar & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }) | null>;
    static getCarBySlug(slug: string): Promise<{
        car: import("mongoose").Document<unknown, {}, ICar, {}, import("mongoose").DefaultSchemaOptions> & ICar & Required<{
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
        tags: never[] | (import("../../../models/tag.model").ITag & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
    } | null>;
    static createCar(carData: any, actor?: AuditActor | null): Promise<import("mongoose").Document<unknown, {}, ICar, {}, import("mongoose").DefaultSchemaOptions> & ICar & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    static updateCar(carId: string, carData: any, actor?: AuditActor | null): Promise<import("mongoose").Document<unknown, {}, ICar, {}, import("mongoose").DefaultSchemaOptions> & ICar & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    static deleteCar(carId: string, actor?: AuditActor | null): Promise<import("mongoose").Document<unknown, {}, ICar, {}, import("mongoose").DefaultSchemaOptions> & ICar & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    static restoreCar(carId: string, actor?: AuditActor | null): Promise<import("mongoose").Document<unknown, {}, ICar, {}, import("mongoose").DefaultSchemaOptions> & ICar & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    static togglePublish(carId: string, actor?: AuditActor | null): Promise<import("mongoose").Document<unknown, {}, ICar, {}, import("mongoose").DefaultSchemaOptions> & ICar & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    static markLaunched(carId: string, actor?: AuditActor | null): Promise<import("mongoose").Document<unknown, {}, ICar, {}, import("mongoose").DefaultSchemaOptions> & ICar & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
    static markUpcoming(carId: string, data: {
        expected_exshowroom_price?: number;
        expected_launch_date?: string;
    }, actor?: AuditActor | null): Promise<import("mongoose").Document<unknown, {}, ICar, {}, import("mongoose").DefaultSchemaOptions> & ICar & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }>;
}
//# sourceMappingURL=car.service.d.ts.map