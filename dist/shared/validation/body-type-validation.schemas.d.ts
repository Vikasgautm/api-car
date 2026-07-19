import { z } from 'zod';
export declare const createBodyTypeSchema: z.ZodObject<{
    name: z.ZodString;
    is_published: z.ZodOptional<z.ZodBoolean>;
    is_featured: z.ZodOptional<z.ZodBoolean>;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    seo_title: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    intro_content: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    short_description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    logo_url: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    logo_title: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    hero_image_url: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    hero_image_alt: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    sort_order: z.ZodNullable<z.ZodOptional<z.ZodCoercedNumber<unknown>>>;
    parent_id: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    related_body_types: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodString>>>;
    created_by: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    updated_by: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    meta_title: z.ZodOptional<z.ZodString>;
    meta_description: z.ZodOptional<z.ZodString>;
    meta_keywords: z.ZodOptional<z.ZodString>;
    og_image: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    canonical_url: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    noindex: z.ZodOptional<z.ZodBoolean>;
}, z.core.$loose>;
export declare const updateBodyTypeSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    is_published: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
    is_featured: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
    description: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    seo_title: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    intro_content: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    short_description: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    logo_url: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    logo_title: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    hero_image_url: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    hero_image_alt: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    sort_order: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodCoercedNumber<unknown>>>>;
    parent_id: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    related_body_types: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodString>>>>;
    created_by: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    updated_by: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    meta_title: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    meta_description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    meta_keywords: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    og_image: z.ZodOptional<z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>>;
    canonical_url: z.ZodOptional<z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>>;
    noindex: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
}, z.core.$loose>;
export declare const bodyTypeFilterSchema: z.ZodObject<{
    page: z.ZodOptional<z.ZodDefault<z.ZodCoercedNumber<unknown>>>;
    limit: z.ZodOptional<z.ZodDefault<z.ZodCoercedNumber<unknown>>>;
    sortBy: z.ZodOptional<z.ZodString>;
    sortOrder: z.ZodOptional<z.ZodEnum<{
        desc: "desc";
        asc: "asc";
    }>>;
    q: z.ZodOptional<z.ZodString>;
    is_published: z.ZodOptional<z.ZodUnion<readonly [z.ZodBoolean, z.ZodEnum<{
        true: "true";
        false: "false";
    }>]>>;
    is_featured: z.ZodOptional<z.ZodUnion<readonly [z.ZodBoolean, z.ZodEnum<{
        true: "true";
        false: "false";
    }>]>>;
}, z.core.$strict>;
