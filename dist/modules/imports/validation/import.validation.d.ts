import { z } from 'zod';
export declare const carPreviewSchema: z.ZodObject<{
    url: z.ZodString;
}, z.core.$strip>;
export declare const carSaveSchema: z.ZodObject<{
    url: z.ZodString;
    mode: z.ZodEnum<{
        create: "create";
        update: "update";
        merge: "merge";
    }>;
    car_id: z.ZodOptional<z.ZodString>;
    data: z.ZodObject<{
        name: z.ZodString;
        brand_id: z.ZodString;
        body_type_id: z.ZodString;
        slug: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        exshowroom_price: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        expected_exshowroom_price: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        is_electric: z.ZodBoolean;
        is_published: z.ZodBoolean;
    }, z.core.$strip>;
    unmatched_data: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, z.core.$strip>;
export declare const variantPreviewSchema: z.ZodObject<{
    car_id: z.ZodString;
    urls: z.ZodArray<z.ZodString>;
}, z.core.$strip>;
export declare const variantSaveSchema: z.ZodObject<{
    car_id: z.ZodString;
    mode: z.ZodEnum<{
        create: "create";
        update: "update";
        merge: "merge";
    }>;
    items: z.ZodArray<z.ZodObject<{
        url: z.ZodString;
        variant_id: z.ZodOptional<z.ZodString>;
        data: z.ZodObject<{
            name: z.ZodString;
            slug: z.ZodString;
            ex_showroom_price: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            expected_price: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            model_year: z.ZodNumber;
            fuel_type_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            transmission_type: z.ZodOptional<z.ZodNullable<z.ZodEnum<{
                manual: "manual";
                automatic: "automatic";
                cvt: "cvt";
                dct: "dct";
                amt: "amt";
            }>>>;
            specs_normalized: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
            is_published: z.ZodBoolean;
        }, z.core.$strip>;
        unmatched_specs: z.ZodOptional<z.ZodArray<z.ZodObject<{
            section: z.ZodString;
            source_label: z.ZodString;
            source_value: z.ZodString;
            suggested_slug: z.ZodString;
            suggested_category: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type CarPreviewInput = z.infer<typeof carPreviewSchema>;
export type CarSaveInput = z.infer<typeof carSaveSchema>;
export type VariantPreviewInput = z.infer<typeof variantPreviewSchema>;
export type VariantSaveInput = z.infer<typeof variantSaveSchema>;
//# sourceMappingURL=import.validation.d.ts.map