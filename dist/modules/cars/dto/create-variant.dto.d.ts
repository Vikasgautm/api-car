import { SpecsNormalized, TransmissionType } from '../../../models/car-variant.model';
export declare class CreateVariantDto {
    car_id: string;
    variant_name: string;
    slug?: string;
    model_year: number;
    fuel_type_id?: string;
    transmission_type: TransmissionType;
    drivetrain?: string;
    seating_capacity?: number;
    body_type?: string;
    ex_showroom_price?: number;
    expected_price?: number;
    expected_launch_date?: Date;
    specs_normalized?: SpecsNormalized;
    hidden_spec_keys?: string[];
    hidden_sections?: string[];
    visibility_overrides?: Record<string, 'auto' | 'manual-show' | 'manual-hide'>;
    is_published?: boolean;
    meta_title?: string;
    meta_description?: string;
    meta_keywords?: string;
    og_image?: string;
    canonical_url?: string;
    noindex?: boolean;
    static validate(dto: CreateVariantDto): {
        valid: boolean;
        errors: string[];
    };
}
//# sourceMappingURL=create-variant.dto.d.ts.map