"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeoPreset = void 0;
const mongoose_1 = require("mongoose");
const seoPresetSchema = new mongoose_1.Schema({
    preset_id: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    h1: { type: String, default: null },
    meta_description: { type: String, default: null, maxlength: 160 },
    meta_keywords: { type: String, default: null },
    hero_intro: { type: String, default: null, maxlength: 2000 },
    query_params: { type: mongoose_1.Schema.Types.Mixed, default: {} },
    is_published: { type: Boolean, default: true },
    is_deleted: { type: Boolean, default: false },
    sort_order: { type: Number, default: 0 },
}, { timestamps: true });
seoPresetSchema.index({ is_published: 1, is_deleted: 1 });
seoPresetSchema.index({ sort_order: 1 });
exports.SeoPreset = (0, mongoose_1.model)('SeoPreset', seoPresetSchema);
//# sourceMappingURL=seo-preset.model.js.map