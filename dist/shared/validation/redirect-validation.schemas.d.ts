import { z } from 'zod';
export declare const redirectBaseSchema: z.ZodObject<{
    old_url: z.ZodString;
    new_url: z.ZodString;
    type: z.ZodOptional<z.ZodEnum<{
        301: "301";
        302: "302";
    }>>;
    reason: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
export declare const createRedirectSchema: z.ZodObject<{
    old_url: z.ZodString;
    new_url: z.ZodString;
    type: z.ZodOptional<z.ZodEnum<{
        301: "301";
        302: "302";
    }>>;
    reason: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
export declare const updateRedirectSchema: z.ZodObject<{
    old_url: z.ZodOptional<z.ZodString>;
    new_url: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodOptional<z.ZodEnum<{
        301: "301";
        302: "302";
    }>>>;
    reason: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, z.core.$strict>;
