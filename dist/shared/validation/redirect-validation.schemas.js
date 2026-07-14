"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateRedirectSchema = exports.createRedirectSchema = exports.redirectBaseSchema = void 0;
const zod_1 = require("zod");
exports.redirectBaseSchema = zod_1.z.object({
    old_url: zod_1.z.string().min(1, 'old_url is required').refine(val => val.startsWith('/'), 'old_url must start with "/" (path only, no origin)'),
    new_url: zod_1.z.string().min(1, 'new_url is required').refine(val => val.startsWith('/'), 'new_url must start with "/" (path only, no origin)'),
    type: zod_1.z.enum(['301', '302']).optional(),
    reason: zod_1.z.string().max(500, 'reason must not exceed 500 characters').optional(),
}).strict();
exports.createRedirectSchema = exports.redirectBaseSchema.refine(data => data.old_url.trim() !== data.new_url.trim(), {
    message: 'old_url and new_url must differ',
    path: ['new_url']
});
exports.updateRedirectSchema = exports.redirectBaseSchema.partial().refine(data => {
    if (data.old_url !== undefined && data.new_url !== undefined) {
        return data.old_url.trim() !== data.new_url.trim();
    }
    return true;
}, {
    message: 'old_url and new_url must differ',
    path: ['new_url']
});
