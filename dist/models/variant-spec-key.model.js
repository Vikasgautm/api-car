"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VariantSpecKey = void 0;
const mongoose_1 = require("mongoose");
const variantSpecKeySchema = new mongoose_1.Schema({
    key_id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    slug: { type: String, required: true },
    category: {
        type: String,
        enum: ['engine_performance', 'mileage_range', 'battery_charging', 'dimensions_practicality', 'suspension_steering_brakes', 'tyres_wheels', 'safety', 'adas', 'comfort_convenience', 'infotainment_connectivity', 'connected_car', 'interior', 'exterior', 'warranty'],
        required: true
    },
    section: { type: String, required: true },
    data_type: {
        type: String,
        enum: ['string', 'number', 'boolean', 'list', 'date'],
        required: true
    },
    unit: { type: String },
    aliases: { type: [String], default: [] },
    fuel_type_visibility: { type: [String], default: [] },
    is_published: { type: Boolean, default: false },
    is_deleted: { type: Boolean, default: false },
    display_order: { type: Number, default: 0 },
}, {
    timestamps: true,
});
variantSpecKeySchema.index({ is_deleted: 1 });
variantSpecKeySchema.index({ is_published: 1 });
variantSpecKeySchema.index({ category: 1 });
variantSpecKeySchema.index({ slug: 1 });
variantSpecKeySchema.index({ name: 'text' });
exports.VariantSpecKey = (0, mongoose_1.model)('VariantSpecKey', variantSpecKeySchema);
//# sourceMappingURL=variant-spec-key.model.js.map