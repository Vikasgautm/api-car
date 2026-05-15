import { Document } from "mongoose";
import { MileageClass } from "../constants/mileage-benchmarks";
export type CarStatus = 'upcoming' | 'launched' | 'discontinued' | 'archived' | 'disabled';
export interface ICar extends Document {
    car_id: string;
    name: string;
    slug: string;
    brand_id: string;
    body_type_id: string;
    fuel_type_id?: string;
    short_description?: string;
    description: string;
    thumbnail?: {
        url: string;
        alt?: string;
    };
    images?: Array<{
        url: string;
        alt?: string;
    }>;
    gallery_summary?: string;
    status: CarStatus;
    is_upcoming: boolean;
    is_launched: boolean;
    expected_exshowroom_price?: number | null;
    expected_launch_date?: Date | null;
    exshowroom_price?: number | null;
    launch_date?: Date | null;
    is_electric: boolean;
    is_published: boolean;
    is_deleted: boolean;
    archived_at?: Date | null;
    archived_by?: string | null;
    disabled_at?: Date | null;
    disabled_by?: string | null;
    discontinued_at?: Date | null;
    discontinued_by?: string | null;
    redirect_to_slug?: string | null;
    model_family?: string | null;
    generation_start_year?: number | null;
    generation_end_year?: number | null;
    generation_label?: string | null;
    is_current: boolean;
    is_facelift: boolean;
    predecessor_car_id?: string | null;
    successor_car_id?: string | null;
    is_featured: boolean;
    is_popular: boolean;
    is_recommended: boolean;
    is_latest: boolean;
    top_selling: boolean;
    tag_ids: string[];
    best_mileage_class?: MileageClass | null;
    best_mileage_value?: number | null;
    best_range_class?: MileageClass | null;
    best_range_value?: number | null;
    editor_user_id?: string | null;
    seo_owner_user_id?: string | null;
    reviewer_user_id?: string | null;
    last_reviewed_at?: Date | null;
    meta_title?: string;
    meta_description?: string;
    meta_keywords?: string;
    og_image?: string;
    canonical_url?: string;
    noindex?: boolean;
}
export declare const Car: import("mongoose").Model<ICar, {}, {}, {}, Document<unknown, {}, ICar, {}, import("mongoose").DefaultSchemaOptions> & ICar & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, ICar>;
//# sourceMappingURL=car.model.d.ts.map