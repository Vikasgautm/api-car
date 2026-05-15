"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Redirect = void 0;
const mongoose_1 = require("mongoose");
const redirectSchema = new mongoose_1.Schema({
    redirect_id: { type: String, required: true, unique: true },
    // Stored without origin, leading slash required, e.g. "/hyundai-creta-2026".
    old_url: { type: String, required: true, trim: true },
    new_url: { type: String, required: true, trim: true },
    type: { type: String, enum: ['301', '302'], default: '301', required: true },
    reason: { type: String, default: null, maxlength: 500 },
    created_by: { type: String, default: null },
    hit_count: { type: Number, default: 0 },
    last_hit_at: { type: Date, default: null },
    is_deleted: { type: Boolean, default: false },
}, { timestamps: true });
// Lookups happen on every public page hit — old_url must be unique among live rows.
redirectSchema.index({ old_url: 1 }, {
    unique: true,
    partialFilterExpression: { is_deleted: false },
    name: 'uniq_old_url_live',
});
redirectSchema.index({ new_url: 1 });
redirectSchema.index({ is_deleted: 1, createdAt: -1 });
exports.Redirect = (0, mongoose_1.model)('Redirect', redirectSchema);
//# sourceMappingURL=redirect.model.js.map