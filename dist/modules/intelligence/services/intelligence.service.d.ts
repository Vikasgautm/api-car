import { BenchmarkThresholds, FuelCategory } from '../../../constants/mileage-benchmarks';
import { IMileageBenchmarkOverride } from '../../../models/mileage-benchmark-override.model';
export interface BenchmarkMatrixRow {
    body_type_id: string;
    body_type_name: string;
    body_type_slug: string;
    benchmark_key: string | null;
    ice: {
        thresholds: BenchmarkThresholds | null;
        source: 'override' | 'default' | 'none';
        override_id?: string;
    };
    ev: {
        thresholds: BenchmarkThresholds | null;
        source: 'override' | 'default' | 'none';
        override_id?: string;
    };
}
export declare class IntelligenceService {
    /**
     * Return the full benchmark matrix: every published body type, ICE + EV, with
     * the active thresholds and where they came from (override vs constant default).
     */
    static getBenchmarkMatrix(): Promise<BenchmarkMatrixRow[]>;
    static upsertOverride(bodyTypeId: string, fuelCategory: FuelCategory, thresholds: BenchmarkThresholds, actorUserId?: string): Promise<IMileageBenchmarkOverride>;
    static deleteOverride(bodyTypeId: string, fuelCategory: FuelCategory): Promise<boolean>;
    /**
     * Reclassify every non-deleted variant. Useful after editing overrides or seeding
     * new body types. Runs car-by-car so progress is observable and aggregates stay
     * consistent. Returns counts of cars and variants touched.
     */
    static reclassifyAll(): Promise<{
        cars: number;
        variants: number;
    }>;
}
//# sourceMappingURL=intelligence.service.d.ts.map