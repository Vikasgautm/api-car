"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cityFilterSchema = exports.updateCitySchema = exports.createCitySchema = void 0;
const zod_1 = require("zod");
const common_validation_schemas_1 = require("./common-validation.schemas");
// City DTO schemas
exports.createCitySchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters'),
    slug: common_validation_schemas_1.slugSchema.optional(),
    state: zod_1.z.string().min(2, 'State must be at least 2 characters'),
    pincode: zod_1.z.number().int().min(100000).max(999999, 'Pincode must be a 6-digit number').optional(),
    longitude: zod_1.z.number().min(-180).max(180).optional(),
    latitude: zod_1.z.number().min(-90).max(90).optional(),
}).strict();
exports.updateCitySchema = exports.createCitySchema.partial().strict();
exports.cityFilterSchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().positive().default(1).optional(),
    limit: zod_1.z.coerce.number().int().positive().max(100).default(10).optional(),
    sortBy: zod_1.z.string().optional(),
    sortOrder: zod_1.z.enum(['asc', 'desc']).optional(),
    q: zod_1.z.string().optional(),
    state: zod_1.z.string().optional(),
}).strict();
