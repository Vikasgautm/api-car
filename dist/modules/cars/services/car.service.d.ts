import { AuditActor } from "../../../shared/utils/audit.util";
import { ICar } from '../../../models/car.model';
export declare class CarService {
    static getAllCars(filterDto: any, includeDeleted?: boolean): Promise<{
        cars: any[];
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
    /**
     * Aggregate the set of related records / SEO surface area for a car.
     * Surfaced in the deletion dialog so an admin sees what they're about to
     * orphan before they OTP their way through a hard delete.
     *
     * inbound_redirects = Redirect rows pointing TO this car (deleting it would
     *   break those redirects' destinations). outbound_redirects = rows whose
     *   old_url is the car's own URL (typically created BY a prior promotion).
     */
    static recomputeAggregatesAll(): Promise<{
        scanned: number;
        recomputed: number;
        failed: number;
    }>;
    static getDependencies(carId: string): Promise<{
        car_id: string;
        name: string;
        slug: string;
        is_published: boolean;
        is_current: boolean;
        status: import("../../../models/car.model").CarStatus;
        model_family: string | null;
        counts: {
            variants: number;
            images: number;
            faqs: number;
            inbound_redirects: number;
            outbound_redirects: number;
            sibling_generations: number;
        };
        warnings: string[];
    }>;
    /**
     * Promote a car to be the current generation of its model_family.
     *
     * Atomicity: Mongo transactions aren't available on every topology, so we
     * run sequential writes and explicitly roll back the slugs we changed if a
     * later step fails. This is safer than partial state without a transaction —
     * the worst case (a crash mid-rollback) leaves the system in a state the
     * admin can manually correct, and we audit every step.
     *
     * Slug collisions hard-fail with a message naming the conflicting slug, per
     * the locked design — no auto-suffix, no silent retry.
     */
    static promoteToCurrent(carId: string, input?: {
        base_slug?: string;
        reason?: string;
    }, actor?: AuditActor | null): Promise<{
        promoted: (import("mongoose").Document<unknown, {}, ICar, {}, import("mongoose").DefaultSchemaOptions> & ICar & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        }) | null;
        outgoing: {
            car_id: string;
            previous_slug: string | null;
            archived_slug: string | null;
        } | null;
        base_slug: string;
        redirect_created: boolean;
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