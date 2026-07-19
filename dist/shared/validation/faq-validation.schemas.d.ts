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
    is_published: z.ZodOptional<z.ZodUnion<readonly [z.ZodBoolean, z.ZodPipe<z.ZodNumber, z.ZodTransform<boolean, number>>, z.ZodPipe<z.ZodEnum<{
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
    faq_type: z.ZodOptional<z.ZodString>;
    intent_type: z.ZodOptional<z.ZodString>;
    entity_type: z.ZodOptional<z.ZodString>;
    entity_id: z.ZodOptional<z.ZodString>;
    related_entities: z.ZodOptional<z.ZodArray<z.ZodUnion<readonly [z.ZodObject<{
        entity_type: z.ZodString;
        entity_id: z.ZodString;
    }, z.core.$strip>, z.ZodString]>>>;
    target_page_types: z.ZodOptional<z.ZodArray<z.ZodString>>;
    template_key: z.ZodOptional<z.ZodString>;
    is_dynamic: z.ZodOptional<z.ZodUnion<readonly [z.ZodBoolean, z.ZodPipe<z.ZodNumber, z.ZodTransform<boolean, number>>, z.ZodPipe<z.ZodEnum<{
        true: "true";
        0: "0";
        1: "1";
        false: "false";
    }>, z.ZodTransform<boolean, "true" | "0" | "1" | "false">>]>>;
    is_editorial: z.ZodOptional<z.ZodUnion<readonly [z.ZodBoolean, z.ZodPipe<z.ZodNumber, z.ZodTransform<boolean, number>>, z.ZodPipe<z.ZodEnum<{
        true: "true";
        0: "0";
        1: "1";
        false: "false";
    }>, z.ZodTransform<boolean, "true" | "0" | "1" | "false">>]>>;
    indexable: z.ZodOptional<z.ZodUnion<readonly [z.ZodBoolean, z.ZodPipe<z.ZodNumber, z.ZodTransform<boolean, number>>, z.ZodPipe<z.ZodEnum<{
        true: "true";
        0: "0";
        1: "1";
        false: "false";
    }>, z.ZodTransform<boolean, "true" | "0" | "1" | "false">>]>>;
    schema_enabled: z.ZodOptional<z.ZodUnion<readonly [z.ZodBoolean, z.ZodPipe<z.ZodNumber, z.ZodTransform<boolean, number>>, z.ZodPipe<z.ZodEnum<{
        true: "true";
        0: "0";
        1: "1";
        false: "false";
    }>, z.ZodTransform<boolean, "true" | "0" | "1" | "false">>]>>;
    needs_refresh: z.ZodOptional<z.ZodUnion<readonly [z.ZodBoolean, z.ZodPipe<z.ZodNumber, z.ZodTransform<boolean, number>>, z.ZodPipe<z.ZodEnum<{
        true: "true";
        0: "0";
        1: "1";
        false: "false";
    }>, z.ZodTransform<boolean, "true" | "0" | "1" | "false">>]>>;
    canonical_intent_key: z.ZodOptional<z.ZodString>;
    priority_score: z.ZodOptional<z.ZodNumber>;
    visibility_status: z.ZodOptional<z.ZodString>;
    source_type: z.ZodOptional<z.ZodString>;
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
    is_published: z.ZodOptional<z.ZodOptional<z.ZodUnion<readonly [z.ZodBoolean, z.ZodPipe<z.ZodNumber, z.ZodTransform<boolean, number>>, z.ZodPipe<z.ZodEnum<{
        true: "true";
        0: "0";
        1: "1";
        false: "false";
    }>, z.ZodTransform<boolean, "true" | "0" | "1" | "false">>]>>>;
    is_featured: z.ZodOptional<z.ZodOptional<z.ZodUnion<readonly [z.ZodBoolean, z.ZodPipe<z.ZodNumber, z.ZodTransform<boolean, number>>, z.ZodPipe<z.ZodEnum<{
        true: "true";
        0: "0";
        1: "1";
        false: "false";
    }>, z.ZodTransform<boolean, "true" | "0" | "1" | "false">>]>>>;
    faq_type: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    intent_type: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    entity_type: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    entity_id: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    related_entities: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodUnion<readonly [z.ZodObject<{
        entity_type: z.ZodString;
        entity_id: z.ZodString;
    }, z.core.$strip>, z.ZodString]>>>>;
    target_page_types: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodString>>>;
    template_key: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    is_dynamic: z.ZodOptional<z.ZodOptional<z.ZodUnion<readonly [z.ZodBoolean, z.ZodPipe<z.ZodNumber, z.ZodTransform<boolean, number>>, z.ZodPipe<z.ZodEnum<{
        true: "true";
        0: "0";
        1: "1";
        false: "false";
    }>, z.ZodTransform<boolean, "true" | "0" | "1" | "false">>]>>>;
    is_editorial: z.ZodOptional<z.ZodOptional<z.ZodUnion<readonly [z.ZodBoolean, z.ZodPipe<z.ZodNumber, z.ZodTransform<boolean, number>>, z.ZodPipe<z.ZodEnum<{
        true: "true";
        0: "0";
        1: "1";
        false: "false";
    }>, z.ZodTransform<boolean, "true" | "0" | "1" | "false">>]>>>;
    indexable: z.ZodOptional<z.ZodOptional<z.ZodUnion<readonly [z.ZodBoolean, z.ZodPipe<z.ZodNumber, z.ZodTransform<boolean, number>>, z.ZodPipe<z.ZodEnum<{
        true: "true";
        0: "0";
        1: "1";
        false: "false";
    }>, z.ZodTransform<boolean, "true" | "0" | "1" | "false">>]>>>;
    schema_enabled: z.ZodOptional<z.ZodOptional<z.ZodUnion<readonly [z.ZodBoolean, z.ZodPipe<z.ZodNumber, z.ZodTransform<boolean, number>>, z.ZodPipe<z.ZodEnum<{
        true: "true";
        0: "0";
        1: "1";
        false: "false";
    }>, z.ZodTransform<boolean, "true" | "0" | "1" | "false">>]>>>;
    needs_refresh: z.ZodOptional<z.ZodOptional<z.ZodUnion<readonly [z.ZodBoolean, z.ZodPipe<z.ZodNumber, z.ZodTransform<boolean, number>>, z.ZodPipe<z.ZodEnum<{
        true: "true";
        0: "0";
        1: "1";
        false: "false";
    }>, z.ZodTransform<boolean, "true" | "0" | "1" | "false">>]>>>;
    canonical_intent_key: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    priority_score: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    visibility_status: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    source_type: z.ZodOptional<z.ZodOptional<z.ZodString>>;
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
