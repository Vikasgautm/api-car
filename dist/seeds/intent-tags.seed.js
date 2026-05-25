"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedIntentTags = void 0;
const uuid_1 = require("uuid");
const tag_category_model_1 = require("../models/tag-category.model");
const tag_model_1 = require("../models/tag.model");
const slug_util_1 = require("../shared/utils/slug.util");
const INTENT_CATEGORY = {
    name: 'Intent',
    slug: 'intent',
    type: 'intent',
    description: 'Audience-based intent classification for SEO, recommendations, and discovery filtering.',
};
const INTENT_TAGS = [
    { name: 'Cars for Women' },
    { name: 'Cars for Doctors' },
    { name: 'Cars for Government Employees' },
    { name: 'Cars for Businessmen' },
    { name: 'Cars for Teachers' },
    { name: 'Cars for Police Officers' },
    { name: 'Cars for Lawyers' },
    { name: 'Cars for IT Professionals' },
    { name: 'Cars for Chartered Accountants' },
    { name: 'Cars for College Students' },
    { name: 'Cars for Senior Citizens' },
    { name: 'Cars for Taxi Drivers' },
    { name: 'Cars for Working Professionals' },
    { name: 'Cars for Army Personnel' },
    { name: 'Cars for Entrepreneurs' },
    { name: 'Cars for Small Business Owners' },
    { name: 'Cars for Delivery Drivers' },
    { name: 'Cars for Real Estate Agents' },
    { name: 'Cars for First-Time Buyers' },
];
const seedIntentTags = async () => {
    // 1. Upsert the intent category, keyed by slug (stable, idempotent).
    let category = await tag_category_model_1.TagCategory.findOne({ slug: INTENT_CATEGORY.slug });
    if (!category) {
        category = await tag_category_model_1.TagCategory.create({
            tag_category_id: (0, uuid_1.v4)(),
            name: INTENT_CATEGORY.name,
            slug: INTENT_CATEGORY.slug,
            type: INTENT_CATEGORY.type,
            description: INTENT_CATEGORY.description,
            is_published: true,
            is_deleted: false,
            sort_order: 0,
        });
    }
    else if (category.is_deleted) {
        category.is_deleted = false;
        await category.save();
    }
    // 2. Seed each intent tag, keyed by slug. Existing tags are left untouched.
    let created = 0;
    for (let i = 0; i < INTENT_TAGS.length; i++) {
        const seed = INTENT_TAGS[i];
        const slug = slug_util_1.SlugUtil.generate(seed.name);
        const existing = await tag_model_1.Tag.findOne({ slug });
        if (existing)
            continue;
        await tag_model_1.Tag.create({
            tag_id: (0, uuid_1.v4)(),
            tag_category_id: category.tag_category_id,
            name: seed.name,
            slug,
            description: seed.description,
            is_published: true,
            is_deleted: false,
            sort_order: i,
        });
        created++;
    }
};
exports.seedIntentTags = seedIntentTags;
//# sourceMappingURL=intent-tags.seed.js.map