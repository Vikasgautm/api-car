"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FuelType = void 0;
const mongoose_1 = require("mongoose");
const fuelTypeSchema = new mongoose_1.Schema({
    fuel_type_id: { type: String, unique: true, required: true },
    name: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String },
}, { timestamps: true });
exports.FuelType = (0, mongoose_1.model)('FuelType', fuelTypeSchema);
//# sourceMappingURL=fuel-type.model.js.map