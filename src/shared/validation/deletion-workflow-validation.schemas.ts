import { z } from 'zod';

export const CreateDeletionRequestDto = z.object({
  entity_type: z.literal('car'),
  entity_id: z.string().min(1, 'Entity ID is required'),
  action: z.enum(['archive', 'disable', 'discontinue', 'hard_delete']),
  reason: z.string().optional(),
  redirect_to_slug: z.string().optional(),
});

export const VerifyDeletionRequestDto = z.object({
  otp: z.string().length(6, 'OTP must be exactly 6 characters'),
});

export type CreateDeletionRequestDtoType = z.infer<typeof CreateDeletionRequestDto>;
export type VerifyDeletionRequestDtoType = z.infer<typeof VerifyDeletionRequestDto>;
