import { z } from 'zod';
export declare const createFaqSchema: z.ZodObject<{
    question: z.ZodString;
    answer: z.ZodString;
    category: z.ZodString;
    order: z.ZodOptional<z.ZodNumber>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
    answer_format: z.ZodOptional<z.ZodEnum<{
        text: "text";
        html: "html";
        markdown: "markdown";
    }>>;
    faq_group: z.ZodOptional<z.ZodString>;
    related_cars: z.ZodOptional<z.ZodArray<z.ZodString>>;
    related_brands: z.ZodOptional<z.ZodArray<z.ZodString>>;
    related_blogs: z.ZodOptional<z.ZodArray<z.ZodString>>;
    is_published: z.ZodOptional<z.ZodBoolean>;
    is_featured: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strict>;
export declare const updateFaqSchema: z.ZodObject<{
    question: z.ZodOptional<z.ZodString>;
    answer: z.ZodOptional<z.ZodString>;
    category: z.ZodOptional<z.ZodString>;
    order: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    tags: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodString>>>;
    answer_format: z.ZodOptional<z.ZodOptional<z.ZodEnum<{
        text: "text";
        html: "html";
        markdown: "markdown";
    }>>>;
    faq_group: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    related_cars: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodString>>>;
    related_brands: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodString>>>;
    related_blogs: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodString>>>;
    is_published: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
    is_featured: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
}, z.core.$strict>;
export declare const faqFilterSchema: z.ZodObject<{
    page: z.ZodOptional<z.ZodDefault<z.ZodCoercedNumber<unknown>>>;
    limit: z.ZodOptional<z.ZodDefault<z.ZodCoercedNumber<unknown>>>;
    sortBy: z.ZodOptional<z.ZodString>;
    sortOrder: z.ZodOptional<z.ZodEnum<{
        desc: "desc";
        asc: "asc";
    }>>;
    q: z.ZodOptional<z.ZodString>;
    category: z.ZodOptional<z.ZodString>;
    is_published: z.ZodOptional<z.ZodUnion<readonly [z.ZodBoolean, z.ZodEnum<{
        true: "true";
        false: "false";
    }>]>>;
    is_featured: z.ZodOptional<z.ZodUnion<readonly [z.ZodBoolean, z.ZodEnum<{
        true: "true";
        false: "false";
    }>]>>;
}, z.core.$strict>;
