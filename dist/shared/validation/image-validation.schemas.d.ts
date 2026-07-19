import { z } from 'zod';
export declare const createImageSchema: z.ZodObject<{
    url: z.ZodString;
    alt_text: z.ZodOptional<z.ZodString>;
    caption: z.ZodOptional<z.ZodString>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
    folder: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
export declare const updateImageSchema: z.ZodObject<{
    url: z.ZodOptional<z.ZodString>;
    alt_text: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    caption: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    tags: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodString>>>;
    folder: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, z.core.$strict>;
export declare const createCarImageSchema: z.ZodObject<{
    car_id: z.ZodString;
    variant_id: z.ZodOptional<z.ZodString>;
    main_category: z.ZodOptional<z.ZodEnum<{
        features: "features";
        exterior: "exterior";
        interior: "interior";
        colours: "colours";
    }>>;
    sub_category: z.ZodOptional<z.ZodEnum<{
        [x: string]: string;
    }>>;
    media_scope: z.ZodOptional<z.ZodEnum<{
        standard: "standard";
        top_variant_showcase: "top_variant_showcase";
    }>>;
    normalized_color: z.ZodOptional<z.ZodString>;
    display_color_name: z.ZodOptional<z.ZodString>;
    url: z.ZodOptional<z.ZodString>;
    image_hash: z.ZodOptional<z.ZodString>;
    image_title: z.ZodOptional<z.ZodString>;
    alt_text: z.ZodOptional<z.ZodString>;
    caption: z.ZodOptional<z.ZodString>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
    source: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<{
        archived: "archived";
        published: "published";
        draft: "draft";
        rejected: "rejected";
    }>>;
    is_primary: z.ZodOptional<z.ZodBoolean>;
    is_published: z.ZodOptional<z.ZodBoolean>;
    sort_order: z.ZodOptional<z.ZodNumber>;
    display_order: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
export declare const updateCarImageSchema: z.ZodObject<{
    car_id: z.ZodOptional<z.ZodString>;
    variant_id: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    main_category: z.ZodOptional<z.ZodOptional<z.ZodEnum<{
        features: "features";
        exterior: "exterior";
        interior: "interior";
        colours: "colours";
    }>>>;
    sub_category: z.ZodOptional<z.ZodOptional<z.ZodEnum<{
        [x: string]: string;
    }>>>;
    media_scope: z.ZodOptional<z.ZodOptional<z.ZodEnum<{
        standard: "standard";
        top_variant_showcase: "top_variant_showcase";
    }>>>;
    normalized_color: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    display_color_name: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    url: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    image_hash: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    image_title: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    alt_text: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    caption: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    tags: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodString>>>;
    source: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    status: z.ZodOptional<z.ZodOptional<z.ZodEnum<{
        archived: "archived";
        published: "published";
        draft: "draft";
        rejected: "rejected";
    }>>>;
    is_primary: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
    is_published: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
    sort_order: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    display_order: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
}, z.core.$strip>;
export declare const carImageFilterSchema: z.ZodObject<{
    page: z.ZodOptional<z.ZodDefault<z.ZodCoercedNumber<unknown>>>;
    limit: z.ZodOptional<z.ZodDefault<z.ZodCoercedNumber<unknown>>>;
    sortBy: z.ZodOptional<z.ZodString>;
    sortOrder: z.ZodOptional<z.ZodEnum<{
        desc: "desc";
        asc: "asc";
    }>>;
    q: z.ZodOptional<z.ZodString>;
    search: z.ZodOptional<z.ZodString>;
    is_featured: z.ZodOptional<z.ZodUnion<readonly [z.ZodBoolean, z.ZodPipe<z.ZodNumber, z.ZodTransform<boolean, number>>, z.ZodPipe<z.ZodEnum<{
        true: "true";
        0: "0";
        1: "1";
        false: "false";
    }>, z.ZodTransform<boolean, "true" | "0" | "1" | "false">>]>>;
    car_id: z.ZodOptional<z.ZodString>;
    variant_id: z.ZodOptional<z.ZodString>;
    main_category: z.ZodOptional<z.ZodEnum<{
        features: "features";
        exterior: "exterior";
        interior: "interior";
        colours: "colours";
    }>>;
    sub_category: z.ZodOptional<z.ZodEnum<{
        [x: string]: string;
    }>>;
    media_scope: z.ZodOptional<z.ZodEnum<{
        standard: "standard";
        top_variant_showcase: "top_variant_showcase";
    }>>;
    status: z.ZodOptional<z.ZodEnum<{
        archived: "archived";
        published: "published";
        draft: "draft";
        rejected: "rejected";
    }>>;
    is_primary: z.ZodOptional<z.ZodUnion<readonly [z.ZodBoolean, z.ZodEnum<{
        true: "true";
        false: "false";
    }>]>>;
    is_published: z.ZodOptional<z.ZodUnion<readonly [z.ZodBoolean, z.ZodEnum<{
        true: "true";
        false: "false";
    }>]>>;
    is_deleted: z.ZodOptional<z.ZodUnion<readonly [z.ZodBoolean, z.ZodEnum<{
        true: "true";
        false: "false";
    }>]>>;
}, z.core.$strip>;
export declare const bulkStatusSchema: z.ZodObject<{
    image_ids: z.ZodArray<z.ZodString>;
    status: z.ZodEnum<{
        archived: "archived";
        published: "published";
        draft: "draft";
        rejected: "rejected";
    }>;
}, z.core.$strip>;
export declare const bulkCategorySchema: z.ZodObject<{
    image_ids: z.ZodArray<z.ZodString>;
    main_category: z.ZodEnum<{
        features: "features";
        exterior: "exterior";
        interior: "interior";
        colours: "colours";
    }>;
    sub_category: z.ZodOptional<z.ZodEnum<{
        [x: string]: string;
    }>>;
}, z.core.$strip>;
export declare const bulkDeleteSchema: z.ZodObject<{
    image_ids: z.ZodArray<z.ZodString>;
}, z.core.$strip>;
export declare const imageFilterSchema: z.ZodObject<{
    page: z.ZodOptional<z.ZodDefault<z.ZodCoercedNumber<unknown>>>;
    limit: z.ZodOptional<z.ZodDefault<z.ZodCoercedNumber<unknown>>>;
    sortBy: z.ZodOptional<z.ZodString>;
    sortOrder: z.ZodOptional<z.ZodEnum<{
        desc: "desc";
        asc: "asc";
    }>>;
    q: z.ZodOptional<z.ZodString>;
    search: z.ZodOptional<z.ZodString>;
    is_deleted: z.ZodOptional<z.ZodUnion<readonly [z.ZodBoolean, z.ZodPipe<z.ZodNumber, z.ZodTransform<boolean, number>>, z.ZodPipe<z.ZodEnum<{
        true: "true";
        0: "0";
        1: "1";
        false: "false";
    }>, z.ZodTransform<boolean, "true" | "0" | "1" | "false">>]>>;
    is_featured: z.ZodOptional<z.ZodUnion<readonly [z.ZodBoolean, z.ZodPipe<z.ZodNumber, z.ZodTransform<boolean, number>>, z.ZodPipe<z.ZodEnum<{
        true: "true";
        0: "0";
        1: "1";
        false: "false";
    }>, z.ZodTransform<boolean, "true" | "0" | "1" | "false">>]>>;
    folder: z.ZodOptional<z.ZodString>;
    is_published: z.ZodOptional<z.ZodUnion<readonly [z.ZodBoolean, z.ZodEnum<{
        true: "true";
        false: "false";
    }>]>>;
}, z.core.$strict>;
