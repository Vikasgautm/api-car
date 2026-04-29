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
    url: z.ZodString;
    alt_text: z.ZodOptional<z.ZodString>;
    caption: z.ZodOptional<z.ZodString>;
    is_primary: z.ZodOptional<z.ZodBoolean>;
    is_published: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strict>;
export declare const updateCarImageSchema: z.ZodObject<{
    car_id: z.ZodOptional<z.ZodString>;
    url: z.ZodOptional<z.ZodString>;
    alt_text: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    caption: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    is_primary: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
    is_published: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
}, z.core.$strict>;
export declare const imageFilterSchema: z.ZodObject<{
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
        0: "0";
        1: "1";
        true: "true";
        false: "false";
    }>, z.ZodTransform<boolean, "0" | "1" | "true" | "false">>]>>;
    is_featured: z.ZodOptional<z.ZodUnion<readonly [z.ZodBoolean, z.ZodPipe<z.ZodEnum<{
        0: "0";
        1: "1";
        true: "true";
        false: "false";
    }>, z.ZodTransform<boolean, "0" | "1" | "true" | "false">>]>>;
    folder: z.ZodOptional<z.ZodString>;
    is_published: z.ZodOptional<z.ZodUnion<readonly [z.ZodBoolean, z.ZodEnum<{
        true: "true";
        false: "false";
    }>]>>;
}, z.core.$strict>;
//# sourceMappingURL=image-validation.schemas.d.ts.map