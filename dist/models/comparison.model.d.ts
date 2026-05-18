import mongoose, { Document } from 'mongoose';
export interface IComparison extends Document {
    comparison_id: string;
    car1_id: mongoose.Types.ObjectId;
    car2_id: mongoose.Types.ObjectId;
    variant1_id?: mongoose.Types.ObjectId;
    variant2_id?: mongoose.Types.ObjectId;
    slug: string;
    title: string;
    category?: string;
    description?: string;
    compareIntroContent?: string;
    isPopular: boolean;
    isTrending: boolean;
    showOnHomepage: boolean;
    relatedComparisons: mongoose.Types.ObjectId[];
    seoMetaTitle?: string;
    seoMetaDescription?: string;
    seoFAQSchema?: Record<string, any>;
    status: 'draft' | 'published' | 'archived';
    is_published: boolean;
    created_by: mongoose.Types.ObjectId;
    updated_by?: mongoose.Types.ObjectId;
    created_at: Date;
    updated_at: Date;
    deleted_at?: Date;
    is_deleted: boolean;
}
export declare const Comparison: mongoose.Model<IComparison, {}, {}, {}, mongoose.Document<unknown, {}, IComparison, {}, mongoose.DefaultSchemaOptions> & IComparison & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IComparison>;
//# sourceMappingURL=comparison.model.d.ts.map