"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportSession = void 0;
const mongoose_1 = require("mongoose");
const ImportSessionSchema = new mongoose_1.Schema({
    session_name: { type: String, required: true, trim: true },
    source_name: { type: String, default: 'manual' },
    total_variants: { type: Number, default: 0 },
    linked_variants: { type: Number, default: 0 },
    validated_variants: { type: Number, default: 0 },
    pushed_variants: { type: Number, default: 0 },
    failed_variants: { type: Number, default: 0 },
    session_status: {
        type: String,
        enum: ['active', 'completed', 'partial', 'failed'],
        default: 'active',
    },
    imported_by: { type: String, default: 'admin' },
    notes: { type: String },
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});
exports.ImportSession = (0, mongoose_1.model)('ImportSession', ImportSessionSchema);
//# sourceMappingURL=ImportSession.js.map