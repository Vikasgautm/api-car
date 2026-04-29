import { z } from 'zod';
export declare const createBlogSchema: z.ZodObject<{
    title: z.ZodString;
    content: z.ZodString;
    excerpt: z.ZodOptional<z.ZodString>;
    author_name: z.ZodOptional<z.ZodString>;
    author_id: z.ZodOptional<z.ZodString>;
    category: z.ZodString;
    tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
    thumbnail_url: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    thumbnail_alt: z.ZodOptional<z.ZodString>;
    images: z.ZodOptional<z.ZodArray<z.ZodObject<{
        url: z.ZodString;
        alt: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>>;
    link: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    is_published: z.ZodOptional<z.ZodBoolean>;
    is_featured: z.ZodOptional<z.ZodBoolean>;
    meta_title: z.ZodOptional<z.ZodString>;
    meta_description: z.ZodOptional<z.ZodString>;
    meta_keywords: z.ZodOptional<z.ZodString>;
    og_image: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    canonical_url: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    noindex: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strict>;
export declare const updateBlogSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    content: z.ZodOptional<z.ZodString>;
    excerpt: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    author_name: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    author_id: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    category: z.ZodOptional<z.ZodString>;
    tags: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodString>>>;
    thumbnail_url: z.ZodOptional<z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>>;
    thumbnail_alt: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    images: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodObject<{
        url: z.ZodString;
        alt: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>>>;
    link: z.ZodOptional<z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>>;
    is_published: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
    is_featured: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
    meta_title: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    meta_description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    meta_keywords: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    og_image: z.ZodOptional<z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>>;
    canonical_url: z.ZodOptional<z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>>;
    noindex: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
}, z.core.$strict>;
export declare const blogFilterSchema: z.ZodObject<{
    page: z.ZodOptional<z.ZodDefault<z.ZodCoercedNumber<unknown>>>;
    limit: z.ZodOptional<z.ZodDefault<z.ZodCoercedNumber<unknown>>>;
    sortBy: z.ZodOptional<z.ZodString>;
    sortOrder: z.ZodOptional<z.ZodEnum<{
        asc: "asc";
        desc: "desc";
    }>>;
    q: z.ZodOptional<z.ZodString>;
    category: z.ZodOptional<z.ZodString>;
    tags: z.ZodOptional<z.ZodString>;
    is_published: z.ZodOptional<z.ZodUnion<readonly [z.ZodBoolean, z.ZodEnum<{
        true: "true";
        false: "false";
    }>]>>;
    is_featured: z.ZodOptional<z.ZodUnion<readonly [z.ZodBoolean, z.ZodEnum<{
        true: "true";
        false: "false";
    }>]>>;
}, z.core.$strict>;
//# sourceMappingURL=blog-validation.schemas.d.ts.map