import { z } from 'zod';

export const redirectBaseSchema = z.object({
  old_url: z.string().min(1, 'old_url is required').refine(val => val.startsWith('/'), 'old_url must start with "/" (path only, no origin)'),
  new_url: z.string().min(1, 'new_url is required').refine(val => val.startsWith('/'), 'new_url must start with "/" (path only, no origin)'),
  type: z.enum(['301', '302']).optional(),
  reason: z.string().max(500, 'reason must not exceed 500 characters').optional(),
}).strict();

export const createRedirectSchema = redirectBaseSchema.refine(data => data.old_url.trim() !== data.new_url.trim(), {
  message: 'old_url and new_url must differ',
  path: ['new_url']
});

export const updateRedirectSchema = redirectBaseSchema.partial().refine(data => {
  if (data.old_url !== undefined && data.new_url !== undefined) {
    return data.old_url.trim() !== data.new_url.trim();
  }
  return true;
}, {
  message: 'old_url and new_url must differ',
  path: ['new_url']
});
