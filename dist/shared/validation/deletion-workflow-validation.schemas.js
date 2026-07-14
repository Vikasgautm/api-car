"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerifyDeletionRequestDto = exports.CreateDeletionRequestDto = void 0;
const zod_1 = require("zod");
exports.CreateDeletionRequestDto = zod_1.z.object({
    entity_type: zod_1.z.literal('car'),
    entity_id: zod_1.z.string().min(1, 'Entity ID is required'),
    action: zod_1.z.enum(['archive', 'disable', 'discontinue', 'hard_delete']),
    reason: zod_1.z.string().optional(),
    redirect_to_slug: zod_1.z.string().optional(),
});
exports.VerifyDeletionRequestDto = zod_1.z.object({
    otp: zod_1.z.string().length(6, 'OTP must be exactly 6 characters'),
});
