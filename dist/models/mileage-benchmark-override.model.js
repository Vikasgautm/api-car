"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MileageBenchmarkOverride = void 0;
const mongoose_1 = require("mongoose");
const overrideSchema = new mongoose_1.Schema({
    override_id: { type: String, required: true, unique: true },
    body_type_id: { type: String, required: true },
    fuel_category: { type: String, enum: ['ice', 'ev'], required: true },
    thresholds: {
        weak_max: { type: Number, required: true, min: 0 },
        average_max: { type: Number, required: true, min: 0 },
        good_max: { type: Number, required: true, min: 0 },
    },
    updated_by: { type: String },
}, { timestamps: true });
overrideSchema.index({ body_type_id: 1, fuel_category: 1 }, { unique: true });
exports.MileageBenchmarkOverride = (0, mongoose_1.model)('MileageBenchmarkOverride', overrideSchema);
//# sourceMappingURL=mileage-benchmark-override.model.js.map