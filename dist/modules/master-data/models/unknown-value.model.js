"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnknownValue = void 0;
const mongoose_1 = require("mongoose");
const uuid_1 = require("uuid");
const unknownValueSchema = new mongoose_1.Schema({
    unknown_id: { type: String, required: true, unique: true, default: () => (0, uuid_1.v4)() },
    category_key: { type: String, required: true, index: true },
    raw_value: { type: String, required: true, trim: true },
    context: { type: String, default: '' },
    occurrence_count: { type: Number, default: 1 },
    is_resolved: { type: Boolean, default: false, index: true },
    resolved_to: { type: String, default: null },
    resolved_at: { type: Date, default: null },
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});
unknownValueSchema.index({ category_key: 1, raw_value: 1 }, { unique: true });
unknownValueSchema.index({ is_resolved: 1, created_at: -1 });
exports.UnknownValue = (0, mongoose_1.model)('UnknownValue', unknownValueSchema);
//# sourceMappingURL=unknown-value.model.js.map