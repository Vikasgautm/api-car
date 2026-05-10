"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportLog = void 0;
const mongoose_1 = require("mongoose");
const importLogSchema = new mongoose_1.Schema({
    import_id: { type: String, required: true, unique: true },
    source: { type: String, enum: ['cardekho'], required: true },
    import_type: { type: String, enum: ['car', 'variant'], required: true },
    source_url: { type: String, required: true },
    car_id: { type: String },
    variant_id: { type: String },
    status: {
        type: String,
        enum: ['previewed', 'saved', 'failed'],
        default: 'previewed'
    },
    extracted_data: { type: mongoose_1.Schema.Types.Mixed, default: {} },
    matched_data: { type: mongoose_1.Schema.Types.Mixed, default: {} },
    unmatched_data: { type: mongoose_1.Schema.Types.Mixed, default: {} },
    warnings: { type: [String], default: [] },
    error_messages: { type: [String], default: [] },
    created_by: { type: String, required: true },
}, {
    timestamps: true,
});
importLogSchema.index({ source_url: 1 });
importLogSchema.index({ car_id: 1 });
importLogSchema.index({ variant_id: 1 });
importLogSchema.index({ status: 1 });
importLogSchema.index({ created_by: 1 });
importLogSchema.index({ createdAt: -1 });
exports.ImportLog = (0, mongoose_1.model)('ImportLog', importLogSchema);
//# sourceMappingURL=import-log.model.js.map