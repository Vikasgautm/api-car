"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CarImage = void 0;
const mongoose_1 = require("mongoose");
const uuid_1 = require("uuid");
const media_constants_1 = require("../shared/services/media/media-constants");
const carImageSchema = new mongoose_1.Schema({
    car_image_id: {
        type: String,
        default: () => (0, uuid_1.v4)(),
        unique: true,
        required: true,
    },
    image_uuid: { type: String, sparse: true },
    car_id: { type: String, required: true },
    variant_id: { type: String },
    // Enum-based categorisation
    main_category: { type: String, enum: media_constants_1.MAIN_CATEGORIES },
    sub_category: { type: String, enum: media_constants_1.ALL_SUBCATEGORIES },
    media_scope: { type: String, enum: media_constants_1.MEDIA_SCOPES, default: 'standard' },
    normalized_color: { type: String },
    display_color_name: { type: String },
    // Legacy FK categorisation
    category_id: { type: String },
    sub_category_id: { type: String },
    // Core image
    url: { type: String, required: true },
    thumbnail_url: { type: String },
    image_hash: { type: String },
    // SEO
    image_title: { type: String },
    alt_text: { type: String },
    caption: { type: String },
    // Status workflow
    status: { type: String, enum: media_constants_1.IMAGE_STATUSES, default: 'draft' },
    // Display / ordering
    sort_order: { type: Number, default: 0 },
    display_order: { type: Number, default: 0 },
    is_primary: { type: Boolean, default: false },
    // Legacy boolean flags (kept for backward compat)
    is_published: { type: Boolean, default: false },
    is_deleted: { type: Boolean, default: false },
    // Metadata
    tags: { type: [String] },
    source: { type: String },
    uploaded_by: { type: String },
    taken_at: { type: Date },
    // Legacy inspection fields
    car_condition: { type: String },
    damage_area: { type: String },
    damage_note: { type: String },
    inspection_severity: { type: String },
    metadata: { type: mongoose_1.Schema.Types.Mixed },
}, { timestamps: true });
// ─── Indexes ──────────────────────────────────────────────────────────────────
// Primary retrieval patterns
carImageSchema.index({ car_id: 1, main_category: 1, sort_order: 1 });
carImageSchema.index({ car_id: 1, main_category: 1, sub_category: 1, sort_order: 1 });
carImageSchema.index({ car_id: 1, media_scope: 1, status: 1 });
carImageSchema.index({ car_id: 1, is_primary: 1, is_deleted: 1 });
carImageSchema.index({ car_id: 1, status: 1, is_deleted: 1 });
// Variant showcase
carImageSchema.index({ variant_id: 1, media_scope: 1, is_deleted: 1 });
// Duplicate detection
carImageSchema.index({ image_hash: 1, car_id: 1 });
// Legacy indexes
carImageSchema.index({ car_id: 1, category_id: 1, sort_order: 1 });
carImageSchema.index({ car_id: 1, sub_category_id: 1, sort_order: 1 });
carImageSchema.index({ category_id: 1, sub_category_id: 1 });
carImageSchema.index({ tags: 1 });
carImageSchema.index({ is_published: 1, is_deleted: 1 });
carImageSchema.index({ status: 1 });
// Unique primary per car (non-deleted)
carImageSchema.index({ car_id: 1, is_primary: 1 }, {
    unique: true,
    partialFilterExpression: { is_primary: true, is_deleted: false },
});
exports.CarImage = (0, mongoose_1.model)('CarImage', carImageSchema);
//# sourceMappingURL=car-image.model.js.map