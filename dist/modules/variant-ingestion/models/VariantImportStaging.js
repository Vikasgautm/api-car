"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VariantImportStaging = void 0;
const mongoose_1 = require("mongoose");
const ValidationIssueSchema = new mongoose_1.Schema({
    field: { type: String, required: true },
    message: { type: String, required: true },
    severity: { type: String, enum: ['error', 'warning'], default: 'error' },
}, { _id: false });
const VariantImportStagingSchema = new mongoose_1.Schema({
    source_car_name: { type: String, required: true, trim: true },
    normalized_car_name: { type: String, default: '' },
    variant_name: { type: String, required: true, trim: true },
    price: { type: Number },
    fuel_type: { type: String },
    transmission: { type: String },
    raw_specs: { type: mongoose_1.Schema.Types.Mixed, default: {} },
    normalized_specs: { type: mongoose_1.Schema.Types.Mixed, default: {} },
    suggested_car_id: { type: String },
    suggested_car_name: { type: String },
    linked_car_id: { type: String },
    linked_car_name: { type: String },
    confidence_score: { type: Number, min: 0, max: 1, default: 0 },
    completeness_score: { type: Number, min: 0, max: 100, default: 0 },
    validation_results: { type: [ValidationIssueSchema], default: [] },
    import_status: {
        type: String,
        enum: ['imported', 'grouped', 'linked', 'validation_failed', 'push_failed', 'reviewed', 'ready_to_push', 'pushed', 'rejected', 'draft'],
        default: 'imported',
    },
    import_session_id: { type: mongoose_1.Schema.Types.ObjectId, ref: 'ImportSession' },
    imported_by: { type: String, default: 'admin' },
    reviewed_by: { type: String },
    linked_by: { type: String },
    pushed_by: { type: String },
    pushed_variant_id: { type: String },
    push_error: { type: String },
    rejection_reason: { type: String },
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});
VariantImportStagingSchema.index({ import_session_id: 1 });
VariantImportStagingSchema.index({ import_status: 1 });
VariantImportStagingSchema.index({ linked_car_id: 1 });
VariantImportStagingSchema.index({ source_car_name: 1 });
VariantImportStagingSchema.index({ normalized_car_name: 1 });
exports.VariantImportStaging = (0, mongoose_1.model)('VariantImportStaging', VariantImportStagingSchema);
//# sourceMappingURL=VariantImportStaging.js.map