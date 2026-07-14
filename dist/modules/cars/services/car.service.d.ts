import { AuditActor } from "../../../shared/utils/audit.util";
import { ICar } from '../../../models/car.model';
export declare class CarService {
    static getAllCars(filterDto: any, includeDeleted?: boolean): Promise<{
        cars: any[];
        pagination: import("../../../shared/interfaces/pagination-response.interface").PaginationMeta;
    }>;
    static getCarById(carId: string): Promise<(ICar & import("../../../sql/common/BaseModel").SQLDocument) | null>;
    static getCarBySlug(slug: string): Promise<{
        car: ICar & import("../../../sql/common/BaseModel").SQLDocument;
        variants: (import("../../../models/car-variant.model").ICarVariant & import("../../../sql/common/BaseModel").SQLDocument)[];
        tags: never[] | (import("../../../models/tag.model").ITag & import("../../../sql/common/BaseModel").SQLDocument)[];
    } | null>;
    static createCar(carData: any, actor?: AuditActor | null): Promise<any>;
    static updateCar(carId: string, carData: any, actor?: AuditActor | null): Promise<ICar & import("../../../sql/common/BaseModel").SQLDocument>;
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
    /**
     * Single-car aggregate recompute — backs the "Recompute from variants" admin
     * button. Returns the computed snapshot so the UI can show what was written.
     */
    static recomputeAggregatesForCar(carId: string): Promise<import("../../../shared/services/car-aggregation.service").CarAggregates | null>;
    /**
     * Refine the car's AI intelligence flags using Claude Haiku 4.5.
     * Only flags whose rule confidence is below threshold are sent to the LLM —
     * unambiguous rule verdicts are kept as-is (saves tokens, avoids spurious flips).
     * Returns null if no ambiguous flags exist (no LLM call was made).
     */
    static refineAiFlagsForCar(carId: string): Promise<import("../../../shared/services/car-intelligence-llm.service").LLMRefinementResult | null>;
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
        promoted: (ICar & import("../../../sql/common/BaseModel").SQLDocument) | null;
        outgoing: {
            car_id: string;
            previous_slug: string | null;
            archived_slug: string | null;
        } | null;
        base_slug: string;
        redirect_created: boolean;
    }>;
    static deleteCar(carId: string, actor?: AuditActor | null): Promise<ICar & import("../../../sql/common/BaseModel").SQLDocument>;
    static restoreCar(carId: string, actor?: AuditActor | null): Promise<ICar & import("../../../sql/common/BaseModel").SQLDocument>;
    static togglePublish(carId: string, actor?: AuditActor | null): Promise<ICar & import("../../../sql/common/BaseModel").SQLDocument>;
    static markLaunched(carId: string, actor?: AuditActor | null): Promise<ICar & import("../../../sql/common/BaseModel").SQLDocument>;
    static markUpcoming(carId: string, data: {
        expected_exshowroom_price?: number;
        expected_launch_date?: string;
    }, actor?: AuditActor | null): Promise<ICar & import("../../../sql/common/BaseModel").SQLDocument>;
}
