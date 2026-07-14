export interface IComparison {
    comparison_id: string;
    car1_id: string;
    car2_id: string;
    variant1_id?: string;
    variant2_id?: string;
    slug: string;
    title: string;
    category?: string;
    description?: string;
    compareIntroContent?: string;
    isPopular: boolean;
    isTrending: boolean;
    showOnHomepage: boolean;
    relatedComparisons: string[];
    seoMetaTitle?: string;
    seoMetaDescription?: string;
    seoFAQSchema?: Record<string, any>;
    status: 'draft' | 'published' | 'archived';
    is_published: boolean;
    created_by: string;
    updated_by?: string;
    created_at: Date;
    updated_at: Date;
    deleted_at?: Date;
    is_deleted: boolean;
}
import { BaseModel } from '../sql/common/BaseModel';
export declare const Comparison: BaseModel<IComparison>;
