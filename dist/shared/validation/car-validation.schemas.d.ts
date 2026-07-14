import { z } from 'zod';
export declare const createCarSchema: z.ZodObject<{
    name: z.ZodString;
    slug: z.ZodOptional<z.ZodString>;
    brand_id: z.ZodString;
    body_type_id: z.ZodString;
    fuel_type_id: z.ZodOptional<z.ZodString>;
    short_description: z.ZodOptional<z.ZodString>;
    description: z.ZodString;
    thumbnail_url: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    thumbnail_alt: z.ZodOptional<z.ZodString>;
    gallery: z.ZodOptional<z.ZodArray<z.ZodObject<{
        url: z.ZodString;
        alt: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>>;
    gallery_summary: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodOptional<z.ZodEnum<{
        archived: "archived";
        launched: "launched";
        upcoming: "upcoming";
        discontinued: "discontinued";
        disabled: "disabled";
    }>>>;
    is_electric: z.ZodOptional<z.ZodUnion<readonly [z.ZodBoolean, z.ZodPipe<z.ZodEnum<{
        true: "true";
        false: "false";
    }>, z.ZodTransform<boolean, "true" | "false">>]>>;
    is_published: z.ZodOptional<z.ZodUnion<readonly [z.ZodBoolean, z.ZodPipe<z.ZodEnum<{
        true: "true";
        false: "false";
    }>, z.ZodTransform<boolean, "true" | "false">>]>>;
    is_featured: z.ZodOptional<z.ZodUnion<readonly [z.ZodBoolean, z.ZodPipe<z.ZodEnum<{
        true: "true";
        false: "false";
    }>, z.ZodTransform<boolean, "true" | "false">>]>>;
    is_upcoming: z.ZodOptional<z.ZodUnion<readonly [z.ZodBoolean, z.ZodPipe<z.ZodEnum<{
        true: "true";
        false: "false";
    }>, z.ZodTransform<boolean, "true" | "false">>]>>;
    is_popular: z.ZodOptional<z.ZodUnion<readonly [z.ZodBoolean, z.ZodPipe<z.ZodEnum<{
        true: "true";
        false: "false";
    }>, z.ZodTransform<boolean, "true" | "false">>]>>;
    is_recommended: z.ZodOptional<z.ZodUnion<readonly [z.ZodBoolean, z.ZodPipe<z.ZodEnum<{
        true: "true";
        false: "false";
    }>, z.ZodTransform<boolean, "true" | "false">>]>>;
    is_latest: z.ZodOptional<z.ZodUnion<readonly [z.ZodBoolean, z.ZodPipe<z.ZodEnum<{
        true: "true";
        false: "false";
    }>, z.ZodTransform<boolean, "true" | "false">>]>>;
    top_selling: z.ZodOptional<z.ZodUnion<readonly [z.ZodBoolean, z.ZodPipe<z.ZodEnum<{
        true: "true";
        false: "false";
    }>, z.ZodTransform<boolean, "true" | "false">>]>>;
    is_launched: z.ZodOptional<z.ZodUnion<readonly [z.ZodBoolean, z.ZodPipe<z.ZodEnum<{
        true: "true";
        false: "false";
    }>, z.ZodTransform<boolean, "true" | "false">>]>>;
    tag_ids: z.ZodOptional<z.ZodUnion<readonly [z.ZodArray<z.ZodString>, z.ZodPipe<z.ZodString, z.ZodTransform<string[], string>>]>>;
    model_family: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    generation_start_year: z.ZodOptional<z.ZodNullable<z.ZodCoercedNumber<unknown>>>;
    generation_end_year: z.ZodOptional<z.ZodNullable<z.ZodCoercedNumber<unknown>>>;
    generation_label: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    is_current: z.ZodOptional<z.ZodUnion<readonly [z.ZodBoolean, z.ZodPipe<z.ZodEnum<{
        true: "true";
        false: "false";
    }>, z.ZodTransform<boolean, "true" | "false">>]>>;
    is_facelift: z.ZodOptional<z.ZodUnion<readonly [z.ZodBoolean, z.ZodPipe<z.ZodEnum<{
        true: "true";
        false: "false";
    }>, z.ZodTransform<boolean, "true" | "false">>]>>;
    predecessor_car_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    successor_car_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    editor_user_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    seo_owner_user_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    reviewer_user_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    meta_title: z.ZodOptional<z.ZodString>;
    meta_description: z.ZodOptional<z.ZodString>;
    meta_keywords: z.ZodOptional<z.ZodString>;
    og_image: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    canonical_url: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    noindex: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strict>;
export declare const updateCarSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    slug: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    brand_id: z.ZodOptional<z.ZodString>;
    body_type_id: z.ZodOptional<z.ZodString>;
    fuel_type_id: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    short_description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    description: z.ZodOptional<z.ZodString>;
    thumbnail_url: z.ZodOptional<z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>>;
    thumbnail_alt: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    gallery: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodObject<{
        url: z.ZodString;
        alt: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>>>;
    gallery_summary: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    status: z.ZodOptional<z.ZodOptional<z.ZodOptional<z.ZodEnum<{
        archived: "archived";
        launched: "launched";
        upcoming: "upcoming";
        discontinued: "discontinued";
        disabled: "disabled";
    }>>>>;
    is_electric: z.ZodOptional<z.ZodOptional<z.ZodUnion<readonly [z.ZodBoolean, z.ZodPipe<z.ZodEnum<{
        true: "true";
        false: "false";
    }>, z.ZodTransform<boolean, "true" | "false">>]>>>;
    is_published: z.ZodOptional<z.ZodOptional<z.ZodUnion<readonly [z.ZodBoolean, z.ZodPipe<z.ZodEnum<{
        true: "true";
        false: "false";
    }>, z.ZodTransform<boolean, "true" | "false">>]>>>;
    is_featured: z.ZodOptional<z.ZodOptional<z.ZodUnion<readonly [z.ZodBoolean, z.ZodPipe<z.ZodEnum<{
        true: "true";
        false: "false";
    }>, z.ZodTransform<boolean, "true" | "false">>]>>>;
    is_upcoming: z.ZodOptional<z.ZodOptional<z.ZodUnion<readonly [z.ZodBoolean, z.ZodPipe<z.ZodEnum<{
        true: "true";
        false: "false";
    }>, z.ZodTransform<boolean, "true" | "false">>]>>>;
    is_popular: z.ZodOptional<z.ZodOptional<z.ZodUnion<readonly [z.ZodBoolean, z.ZodPipe<z.ZodEnum<{
        true: "true";
        false: "false";
    }>, z.ZodTransform<boolean, "true" | "false">>]>>>;
    is_recommended: z.ZodOptional<z.ZodOptional<z.ZodUnion<readonly [z.ZodBoolean, z.ZodPipe<z.ZodEnum<{
        true: "true";
        false: "false";
    }>, z.ZodTransform<boolean, "true" | "false">>]>>>;
    is_latest: z.ZodOptional<z.ZodOptional<z.ZodUnion<readonly [z.ZodBoolean, z.ZodPipe<z.ZodEnum<{
        true: "true";
        false: "false";
    }>, z.ZodTransform<boolean, "true" | "false">>]>>>;
    top_selling: z.ZodOptional<z.ZodOptional<z.ZodUnion<readonly [z.ZodBoolean, z.ZodPipe<z.ZodEnum<{
        true: "true";
        false: "false";
    }>, z.ZodTransform<boolean, "true" | "false">>]>>>;
    is_launched: z.ZodOptional<z.ZodOptional<z.ZodUnion<readonly [z.ZodBoolean, z.ZodPipe<z.ZodEnum<{
        true: "true";
        false: "false";
    }>, z.ZodTransform<boolean, "true" | "false">>]>>>;
    tag_ids: z.ZodOptional<z.ZodOptional<z.ZodUnion<readonly [z.ZodArray<z.ZodString>, z.ZodPipe<z.ZodString, z.ZodTransform<string[], string>>]>>>;
    model_family: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
    generation_start_year: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodCoercedNumber<unknown>>>>;
    generation_end_year: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodCoercedNumber<unknown>>>>;
    generation_label: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
    is_current: z.ZodOptional<z.ZodOptional<z.ZodUnion<readonly [z.ZodBoolean, z.ZodPipe<z.ZodEnum<{
        true: "true";
        false: "false";
    }>, z.ZodTransform<boolean, "true" | "false">>]>>>;
    is_facelift: z.ZodOptional<z.ZodOptional<z.ZodUnion<readonly [z.ZodBoolean, z.ZodPipe<z.ZodEnum<{
        true: "true";
        false: "false";
    }>, z.ZodTransform<boolean, "true" | "false">>]>>>;
    predecessor_car_id: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
    successor_car_id: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
    editor_user_id: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
    seo_owner_user_id: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
    reviewer_user_id: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
    meta_title: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    meta_description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    meta_keywords: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    og_image: z.ZodOptional<z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>>;
    canonical_url: z.ZodOptional<z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>>;
    noindex: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
}, z.core.$strict>;
export declare const createVariantSchema: z.ZodObject<{
    car_id: z.ZodString;
    variant_id: z.ZodOptional<z.ZodString>;
    variant_name: z.ZodString;
    model_year: z.ZodNumber;
    fuel_type_id: z.ZodString;
    transmission_type: z.ZodEnum<{
        manual: "manual";
        automatic: "automatic";
        amt: "amt";
        cvt: "cvt";
        dct: "dct";
        dsg: "dsg";
        imt: "imt";
        torque_converter: "torque_converter";
        single_speed_ev: "single_speed_ev";
        e_cvt: "e_cvt";
    }>;
    drivetrain: z.ZodOptional<z.ZodString>;
    seating_capacity: z.ZodOptional<z.ZodNumber>;
    ex_showroom_price: z.ZodOptional<z.ZodNumber>;
    expected_price: z.ZodOptional<z.ZodNumber>;
    expected_launch_date: z.ZodOptional<z.ZodCoercedDate<unknown>>;
    is_published: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strict>;
export declare const updateVariantSchema: z.ZodObject<{
    car_id: z.ZodOptional<z.ZodString>;
    variant_id: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    variant_name: z.ZodOptional<z.ZodString>;
    model_year: z.ZodOptional<z.ZodNumber>;
    fuel_type_id: z.ZodOptional<z.ZodString>;
    transmission_type: z.ZodOptional<z.ZodEnum<{
        manual: "manual";
        automatic: "automatic";
        amt: "amt";
        cvt: "cvt";
        dct: "dct";
        dsg: "dsg";
        imt: "imt";
        torque_converter: "torque_converter";
        single_speed_ev: "single_speed_ev";
        e_cvt: "e_cvt";
    }>>;
    drivetrain: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    seating_capacity: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    ex_showroom_price: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    expected_price: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    expected_launch_date: z.ZodOptional<z.ZodOptional<z.ZodCoercedDate<unknown>>>;
    is_published: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
}, z.core.$strict>;
export declare const carFilterSchema: z.ZodObject<{
    page: z.ZodOptional<z.ZodDefault<z.ZodCoercedNumber<unknown>>>;
    limit: z.ZodOptional<z.ZodDefault<z.ZodCoercedNumber<unknown>>>;
    sortBy: z.ZodOptional<z.ZodString>;
    sortOrder: z.ZodOptional<z.ZodEnum<{
        desc: "desc";
        asc: "asc";
    }>>;
    q: z.ZodOptional<z.ZodString>;
    brand_id: z.ZodOptional<z.ZodString>;
    body_type_id: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodOptional<z.ZodEnum<{
        archived: "archived";
        launched: "launched";
        upcoming: "upcoming";
        discontinued: "discontinued";
        disabled: "disabled";
    }>>>;
    is_electric: z.ZodOptional<z.ZodUnion<readonly [z.ZodBoolean, z.ZodEnum<{
        true: "true";
        false: "false";
    }>]>>;
    is_published: z.ZodOptional<z.ZodUnion<readonly [z.ZodBoolean, z.ZodEnum<{
        true: "true";
        false: "false";
    }>]>>;
    is_featured: z.ZodOptional<z.ZodUnion<readonly [z.ZodBoolean, z.ZodEnum<{
        true: "true";
        false: "false";
    }>]>>;
    min_price: z.ZodOptional<z.ZodNumber>;
    max_price: z.ZodOptional<z.ZodNumber>;
    tag_ids: z.ZodOptional<z.ZodUnion<readonly [z.ZodArray<z.ZodString>, z.ZodString]>>;
    tag_slugs: z.ZodOptional<z.ZodUnion<readonly [z.ZodArray<z.ZodString>, z.ZodString]>>;
    mileage_class: z.ZodOptional<z.ZodUnion<readonly [z.ZodArray<z.ZodEnum<{
        weak: "weak";
        average: "average";
        good: "good";
        excellent: "excellent";
    }>>, z.ZodString]>>;
    range_class: z.ZodOptional<z.ZodUnion<readonly [z.ZodArray<z.ZodEnum<{
        weak: "weak";
        average: "average";
        good: "good";
        excellent: "excellent";
    }>>, z.ZodString]>>;
}, z.core.$strict>;
