import { Document } from 'mongoose';
import { FuelCategory } from '../constants/mileage-benchmarks';
export interface IMileageBenchmarkOverride extends Document {
    override_id: string;
    body_type_id: string;
    fuel_category: FuelCategory;
    thresholds: {
        weak_max: number;
        average_max: number;
        good_max: number;
    };
    updated_by?: string;
}
export declare const MileageBenchmarkOverride: import("mongoose").Model<IMileageBenchmarkOverride, {}, {}, {}, Document<unknown, {}, IMileageBenchmarkOverride, {}, import("mongoose").DefaultSchemaOptions> & IMileageBenchmarkOverride & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IMileageBenchmarkOverride>;
//# sourceMappingURL=mileage-benchmark-override.model.d.ts.map