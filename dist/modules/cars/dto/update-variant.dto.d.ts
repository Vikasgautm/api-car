import { SpecsNormalized, TransmissionType, VariantMarketStatus, PublishStatus, VariantLifecycleStatus } from '../../../models/car-variant.model';
export declare class UpdateVariantDto {
    car_id?: string;
    variant_name?: string;
    slug?: string;
    model_year?: number;
    fuel_type_id?: string;
    transmission_type?: TransmissionType;
    drivetrain?: string;
    seating_capacity?: number;
    body_type?: string;
    ex_showroom_price?: number;
    expected_price?: number;
    expected_launch_date?: Date;
    is_upcoming?: boolean;
    specs_normalized?: SpecsNormalized;
    hidden_spec_keys?: string[];
    hidden_sections?: string[];
    visibility_overrides?: Record<string, 'auto' | 'manual-show' | 'manual-hide'>;
    is_published?: boolean;
    is_archived?: boolean;
    archived_at?: Date;
    archived_by?: string;
    editor_user_id?: string | null;
    seo_owner_user_id?: string | null;
    reviewer_user_id?: string | null;
    meta_title?: string;
    meta_description?: string;
    meta_keywords?: string;
    og_image?: string;
    canonical_url?: string;
    noindex?: boolean;
    variant_rank?: number;
    trim_name?: string;
    edition_name?: string;
    value_for_money_tag?: boolean;
    best_for_tags?: string[];
    variant_highlights?: string[];
    market_status?: VariantMarketStatus;
    publish_status?: PublishStatus;
    variant_status?: VariantLifecycleStatus;
    static validate(dto: UpdateVariantDto): {
        valid: boolean;
        errors: string[];
    };
}
//# sourceMappingURL=update-variant.dto.d.ts.map