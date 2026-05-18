import mongoose, { Document } from 'mongoose';
export interface IComparisonRival extends Document {
    rival_id: string;
    primary_car_id: mongoose.Types.ObjectId;
    rival_car_id: mongoose.Types.ObjectId;
    relationship_strength: number;
    primary_segment?: string;
    rival_segment?: string;
    price_proximity?: number;
    manual_mapping: boolean;
    created_at: Date;
    updated_at: Date;
}
export declare const ComparisonRival: mongoose.Model<IComparisonRival, {}, {}, {}, mongoose.Document<unknown, {}, IComparisonRival, {}, mongoose.DefaultSchemaOptions> & IComparisonRival & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IComparisonRival>;
//# sourceMappingURL=comparison-rival.model.d.ts.map