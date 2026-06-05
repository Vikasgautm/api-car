"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportKeyMapping = void 0;
const mongoose_1 = require("mongoose");
const uuid_1 = require("uuid");
const ImportKeyMappingSchema = new mongoose_1.Schema({
    mapping_id: { type: String, default: () => (0, uuid_1.v4)(), unique: true },
    source: { type: String, enum: ['carwale', 'cardekho'], required: true },
    scraped_key: { type: String, required: true },
    normalized_scraped_key: { type: String, required: true },
    target_model: { type: String, enum: ['Car', 'CarVariant'], required: true },
    target_field: { type: String, required: true },
    target_section: { type: String },
    value_type: { type: String, enum: ['string', 'number', 'boolean', 'array'], default: 'string' },
    is_active: { type: Boolean, default: true },
    created_by: { type: String },
    updated_by: { type: String },
}, { timestamps: true });
// Compound index: one active mapping per (source, scraped_key, target_model)
ImportKeyMappingSchema.index({ source: 1, normalized_scraped_key: 1, target_model: 1 }, { unique: true, partialFilterExpression: { is_active: true } });
ImportKeyMappingSchema.index({ source: 1, scraped_key: 1 });
exports.ImportKeyMapping = (0, mongoose_1.model)('ImportKeyMapping', ImportKeyMappingSchema);
//# sourceMappingURL=import-key-mapping.model.js.map