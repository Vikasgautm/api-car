"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FuelType = void 0;
const mongoose_1 = require("mongoose");
const fuelTypeSchema = new mongoose_1.Schema({
    fuel_type_id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String },
    is_published: { type: Boolean, default: false },
    is_deleted: { type: Boolean, default: false },
    is_featured: { type: Boolean, default: false },
}, {
    timestamps: true,
});
// Consolidated index - compound index handles queries that would use single boolean indexes
fuelTypeSchema.index({ is_published: 1, is_deleted: 1 });
fuelTypeSchema.index({ name: 1 });
fuelTypeSchema.index({ name: 'text' });
exports.FuelType = (0, mongoose_1.model)('FuelType', fuelTypeSchema);
//# sourceMappingURL=fuel-type.model.js.map