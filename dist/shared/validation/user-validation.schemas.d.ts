import { z } from 'zod';
export declare const registerSchema: z.ZodObject<{
    user_name: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
    phone: z.ZodOptional<z.ZodString>;
    role: z.ZodOptional<z.ZodEnum<{
        super_admin: "super_admin";
        admin: "admin";
        editor: "editor";
        user: "user";
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
        super_admin: "super_admin";
        admin: "admin";
        editor: "editor";
        user: "user";
    }>>;
    is_email_verified: z.ZodOptional<z.ZodBoolean>;
    theme: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
export declare const userFilterSchema: z.ZodObject<{
    page: z.ZodOptional<z.ZodDefault<z.ZodCoercedNumber<unknown>>>;
    limit: z.ZodOptional<z.ZodDefault<z.ZodCoercedNumber<unknown>>>;
    sortBy: z.ZodOptional<z.ZodString>;
    sortOrder: z.ZodOptional<z.ZodEnum<{
        asc: "asc";
        desc: "desc";
    }>>;
    q: z.ZodOptional<z.ZodString>;
    search: z.ZodOptional<z.ZodString>;
    is_published: z.ZodOptional<z.ZodUnion<readonly [z.ZodBoolean, z.ZodPipe<z.ZodEnum<{
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
    role: z.ZodOptional<z.ZodEnum<{
        super_admin: "super_admin";
        admin: "admin";
        editor: "editor";
        user: "user";
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
//# sourceMappingURL=user-validation.schemas.d.ts.map