import { z } from 'zod';
import { userRoleSchema, emailSchema, paginationSchema } from './common-validation.schemas';

// User DTO schemas
export const registerSchema = z.object({
  user_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: emailSchema,
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().min(10, 'Phone number must be at least 10 characters').optional(),
  role: userRoleSchema.optional(),
}).strict();

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
}).strict();

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
}).strict();

export const updateProfileSchema = z.object({
  user_name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  phone: z.string().min(10, 'Phone number must be at least 10 characters').optional().or(z.literal('')),
  profile_pic: z.string().url().optional().or(z.literal('')),
}).strict();

export const adminUpdateUserSchema = z.object({
  user_name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  email: emailSchema.optional(),
  phone: z.string().min(10, 'Phone number must be at least 10 characters').optional().or(z.literal('')),
  profile_pic: z.string().url().optional().or(z.literal('')),
  role: userRoleSchema.optional(),
  is_email_verified: z.boolean().optional(),
  theme: z.string().optional(),
}).strict();

export const userFilterSchema = paginationSchema.extend({
  role: userRoleSchema.optional(),
  is_email_verified: z.union([z.boolean(), z.enum(['true', 'false'])]).optional(),
  is_deleted: z.union([z.boolean(), z.enum(['true', 'false'])]).optional(),
}).strict();

export type UserFilterDto = z.infer<typeof userFilterSchema>;
