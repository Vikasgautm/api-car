"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetRivalsDTO = exports.CreateRivalDTO = exports.ComparisonQueryDTO = exports.UpdateComparisonDTO = exports.CreateComparisonDTO = void 0;
const zod_1 = require("zod");
// Accept either Mongo ObjectId (24) or UUID (36) — the service resolves both.
const carIdSchema = zod_1.z.string().min(24, 'Invalid car ID').max(40, 'Invalid car ID');
// Base schema shared between create and update (partial).
// Refine for car1 ≠ car2 is applied only on create since update is partial.
const ComparisonBaseSchema = zod_1.z.object({
    car1_id: carIdSchema,
    car2_id: carIdSchema,
    variant1_id: zod_1.z.string().optional(),
    variant2_id: zod_1.z.string().optional(),
    slug: zod_1.z.string().min(3, 'Slug must be at least 3 characters').regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
    title: zod_1.z.string().min(3, 'Title must be at least 3 characters').max(200, 'Title must be less than 200 characters'),
    category: zod_1.z.enum(['suv', 'sedan', 'hatchback', 'coupe', 'mpv', 'ev', 'luxury', 'budget', 'mid_range']).optional(),
    description: zod_1.z.string().optional(),
    compareIntroContent: zod_1.z.string().optional(),
    isPopular: zod_1.z.boolean().default(false),
    isTrending: zod_1.z.boolean().default(false),
    showOnHomepage: zod_1.z.boolean().default(false),
    relatedComparisons: zod_1.z.array(zod_1.z.string()).optional(),
    seoMetaTitle: zod_1.z.string().optional(),
    seoMetaDescription: zod_1.z.string().optional(),
    seoFAQSchema: zod_1.z.record(zod_1.z.string(), zod_1.z.any()).optional(),
    status: zod_1.z.enum(['draft', 'published', 'archived']).default('draft'),
    is_published: zod_1.z.boolean().default(false),
});
exports.CreateComparisonDTO = ComparisonBaseSchema.refine((d) => d.car1_id !== d.car2_id, { message: 'Car 1 and Car 2 cannot be the same', path: ['car2_id'] });
exports.UpdateComparisonDTO = ComparisonBaseSchema.partial();
const booleanFromQuery = zod_1.z.preprocess((val) => (val === 'false' ? false : val === 'true' ? true : val), zod_1.z.boolean());
exports.ComparisonQueryDTO = zod_1.z.object({
    page: zod_1.z.coerce.number().int().positive().default(1),
    limit: zod_1.z.coerce.number().int().positive().max(100).default(10),
    search: zod_1.z.string().optional(),
    category: zod_1.z.string().optional(),
    status: zod_1.z.enum(['draft', 'published', 'archived']).optional(),
    isPopular: booleanFromQuery.optional(),
    isTrending: booleanFromQuery.optional(),
    is_deleted: booleanFromQuery.default(false),
});
exports.CreateRivalDTO = zod_1.z.object({
    primary_car_id: zod_1.z.string().min(24, 'Invalid primary car ID'),
    rival_car_id: zod_1.z.string().min(24, 'Invalid rival car ID'),
    relationship_strength: zod_1.z.number().min(0).max(100).default(50),
});
exports.GetRivalsDTO = zod_1.z.object({
    car_id: zod_1.z.string().min(24, 'Invalid car ID'),
    limit: zod_1.z.coerce.number().int().positive().max(50).default(10),
});
//# sourceMappingURL=comparison.dto.js.map