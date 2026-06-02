import { z } from 'zod';
export declare const objectIdSchema: z.ZodString;
export declare const uuidSchema: z.ZodString;
export declare const slugSchema: z.ZodString;
export declare const emailSchema: z.ZodString;
export declare const urlSchema: z.ZodString;
export declare const booleanStringSchema: z.ZodUnion<readonly [z.ZodBoolean, z.ZodPipe<z.ZodEnum<{
    true: "true";
    0: "0";
    1: "1";
    false: "false";
}>, z.ZodTransform<boolean, "true" | "0" | "1" | "false">>]>;
export declare const paginationSchema: z.ZodObject<{
    page: z.ZodOptional<z.ZodDefault<z.ZodCoercedNumber<unknown>>>;
    limit: z.ZodOptional<z.ZodDefault<z.ZodCoercedNumber<unknown>>>;
    sortBy: z.ZodOptional<z.ZodString>;
    sortOrder: z.ZodOptional<z.ZodEnum<{
        asc: "asc";
        desc: "desc";
    }>>;
    q: z.ZodOptional<z.ZodString>;
    search: z.ZodOptional<z.ZodString>;
    is_deleted: z.ZodOptional<z.ZodUnion<readonly [z.ZodBoolean, z.ZodPipe<z.ZodEnum<{
        true: "true";
        0: "0";
        1: "1";
        false: "false";
    }>, z.ZodTransform<boolean, "true" | "0" | "1" | "false">>]>>;
    is_published: z.ZodOptional<z.ZodUnion<readonly [z.ZodBoolean, z.ZodPipe<z.ZodEnum<{
        true: "true";
        0: "0";
        1: "1";
        false: "false";
    }>, z.ZodTransform<boolean, "true" | "0" | "1" | "false">>]>>;
    is_featured: z.ZodOptional<z.ZodUnion<readonly [z.ZodBoolean, z.ZodPipe<z.ZodEnum<{
        true: "true";
        0: "0";
        1: "1";
        false: "false";
    }>, z.ZodTransform<boolean, "true" | "0" | "1" | "false">>]>>;
}, z.core.$strip>;
export declare const publishStatusSchema: z.ZodOptional<z.ZodEnum<{
    archived: "archived";
    upcoming: "upcoming";
    launched: "launched";
    discontinued: "discontinued";
    disabled: "disabled";
}>>;
export declare const transmissionTypeSchema: z.ZodEnum<{
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
export declare const answerFormatSchema: z.ZodEnum<{
    text: "text";
    html: "html";
    markdown: "markdown";
}>;
export declare const userRoleSchema: z.ZodEnum<{
    user: "user";
    editor: "editor";
    admin: "admin";
    super_admin: "super_admin";
}>;
export declare const metaFieldsSchema: z.ZodObject<{
    meta_title: z.ZodOptional<z.ZodString>;
    meta_description: z.ZodOptional<z.ZodString>;
    meta_keywords: z.ZodOptional<z.ZodString>;
    og_image: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    canonical_url: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    noindex: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strict>;
export declare const commonFieldsSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    is_published: z.ZodOptional<z.ZodBoolean>;
    is_featured: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export declare const idParamSchema: z.ZodObject<{
    id: z.ZodString;
}, z.core.$strip>;
export declare const slugParamSchema: z.ZodObject<{
    slug: z.ZodString;
}, z.core.$strip>;
export declare const carIdParamSchema: z.ZodObject<{
    carId: z.ZodString;
}, z.core.$strip>;
export declare const uuidIdParamSchema: z.ZodObject<{
    id: z.ZodString;
}, z.core.$strip>;
//# sourceMappingURL=common-validation.schemas.d.ts.map