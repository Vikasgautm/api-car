import { z } from 'zod';
export declare const createCitySchema: z.ZodObject<{
    name: z.ZodString;
    slug: z.ZodOptional<z.ZodString>;
    state: z.ZodString;
    pincode: z.ZodOptional<z.ZodString>;
    longitude: z.ZodOptional<z.ZodNumber>;
    latitude: z.ZodOptional<z.ZodNumber>;
    city_logo: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    is_published: z.ZodOptional<z.ZodBoolean>;
    is_featured: z.ZodOptional<z.ZodBoolean>;
    meta_title: z.ZodOptional<z.ZodString>;
    meta_description: z.ZodOptional<z.ZodString>;
    meta_keywords: z.ZodOptional<z.ZodString>;
    og_image: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    canonical_url: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    noindex: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strict>;
export declare const updateCitySchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    slug: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    state: z.ZodOptional<z.ZodString>;
    pincode: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    longitude: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    latitude: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    city_logo: z.ZodOptional<z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>>;
    is_published: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
    is_featured: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
    meta_title: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    meta_description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    meta_keywords: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    og_image: z.ZodOptional<z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>>;
    canonical_url: z.ZodOptional<z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>>;
    noindex: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
}, z.core.$strict>;
export declare const cityFilterSchema: z.ZodObject<{
    page: z.ZodOptional<z.ZodDefault<z.ZodCoercedNumber<unknown>>>;
    limit: z.ZodOptional<z.ZodDefault<z.ZodCoercedNumber<unknown>>>;
    sortBy: z.ZodOptional<z.ZodString>;
    sortOrder: z.ZodOptional<z.ZodEnum<{
        asc: "asc";
        desc: "desc";
    }>>;
    q: z.ZodOptional<z.ZodString>;
    state: z.ZodOptional<z.ZodString>;
    is_published: z.ZodOptional<z.ZodUnion<readonly [z.ZodBoolean, z.ZodEnum<{
        true: "true";
        false: "false";
    }>]>>;
    is_featured: z.ZodOptional<z.ZodUnion<readonly [z.ZodBoolean, z.ZodEnum<{
        true: "true";
        false: "false";
    }>]>>;
}, z.core.$strict>;
//# sourceMappingURL=city-validation.schemas.d.ts.map