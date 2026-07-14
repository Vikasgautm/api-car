import { z } from 'zod';
export declare const registerSchema: z.ZodObject<{
    user_name: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
    phone: z.ZodOptional<z.ZodString>;
    role: z.ZodOptional<z.ZodEnum<{
        user: "user";
        editor: "editor";
        admin: "admin";
        super_admin: "super_admin";
    }>>;
}, z.core.$strict>;
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, z.core.$strict>;
export declare const refreshTokenSchema: z.ZodObject<{
    refreshToken: z.ZodString;
}, z.core.$strict>;
export declare const updateProfileSchema: z.ZodObject<{
    user_name: z.ZodOptional<z.ZodString>;
    phone: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    profile_pic: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
}, z.core.$strict>;
export declare const adminUpdateUserSchema: z.ZodObject<{
    user_name: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    phone: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    profile_pic: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    role: z.ZodOptional<z.ZodEnum<{
        user: "user";
        editor: "editor";
        admin: "admin";
        super_admin: "super_admin";
    }>>;
    is_email_verified: z.ZodOptional<z.ZodBoolean>;
    theme: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
export declare const userFilterSchema: z.ZodObject<{
    page: z.ZodOptional<z.ZodDefault<z.ZodCoercedNumber<unknown>>>;
    limit: z.ZodOptional<z.ZodDefault<z.ZodCoercedNumber<unknown>>>;
    sortBy: z.ZodOptional<z.ZodString>;
    sortOrder: z.ZodOptional<z.ZodEnum<{
        desc: "desc";
        asc: "asc";
    }>>;
    q: z.ZodOptional<z.ZodString>;
    search: z.ZodOptional<z.ZodString>;
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
    role: z.ZodOptional<z.ZodEnum<{
        user: "user";
        editor: "editor";
        admin: "admin";
        super_admin: "super_admin";
    }>>;
    is_email_verified: z.ZodOptional<z.ZodUnion<readonly [z.ZodBoolean, z.ZodEnum<{
        true: "true";
        false: "false";
    }>]>>;
    is_deleted: z.ZodOptional<z.ZodUnion<readonly [z.ZodBoolean, z.ZodEnum<{
        true: "true";
        false: "false";
    }>]>>;
}, z.core.$strict>;
export type UserFilterDto = z.infer<typeof userFilterSchema>;
