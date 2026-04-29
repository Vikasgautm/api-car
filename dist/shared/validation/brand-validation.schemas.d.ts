import { z } from 'zod';
export declare const createBrandSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    is_published: z.ZodOptional<z.ZodBoolean>;
    is_featured: z.ZodOptional<z.ZodBoolean>;
    logo_url: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    logo_title: z.ZodOptional<z.ZodString>;
    meta_title: z.ZodOptional<z.ZodString>;
    meta_description: z.ZodOptional<z.ZodString>;
    meta_keywords: z.ZodOptional<z.ZodString>;
    og_image: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    canonical_url: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    noindex: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strict>;
export declare const updateBrandSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    is_published: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
    is_featured: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
    logo_url: z.ZodOptional<z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>>;
    logo_title: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    meta_title: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    meta_description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    meta_keywords: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    og_image: z.ZodOptional<z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>>;
    canonical_url: z.ZodOptional<z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>>;
    noindex: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
}, z.core.$strict>;
export declare const brandFilterSchema: z.ZodObject<{
    page: z.ZodOptional<z.ZodDefault<z.ZodCoercedNumber<unknown>>>;
    limit: z.ZodOptional<z.ZodDefault<z.ZodCoercedNumber<unknown>>>;
    sortBy: z.ZodOptional<z.ZodString>;
    sortOrder: z.ZodOptional<z.ZodEnum<{
        asc: "asc";
        desc: "desc";
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
//# sourceMappingURL=brand-validation.schemas.d.ts.map