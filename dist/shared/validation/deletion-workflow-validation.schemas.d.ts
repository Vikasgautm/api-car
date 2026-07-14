import { z } from 'zod';
export declare const CreateDeletionRequestDto: z.ZodObject<{
    entity_type: z.ZodLiteral<"car">;
    entity_id: z.ZodString;
    action: z.ZodEnum<{
        archive: "archive";
        disable: "disable";
        discontinue: "discontinue";
        hard_delete: "hard_delete";
    }>;
    reason: z.ZodOptional<z.ZodString>;
    redirect_to_slug: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const VerifyDeletionRequestDto: z.ZodObject<{
    otp: z.ZodString;
}, z.core.$strip>;
export type CreateDeletionRequestDtoType = z.infer<typeof CreateDeletionRequestDto>;
export type VerifyDeletionRequestDtoType = z.infer<typeof VerifyDeletionRequestDto>;
