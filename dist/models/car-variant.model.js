"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CarVariant = void 0;
const mongoose_1 = require("mongoose");
const variantSchema = new mongoose_1.Schema({
    variant_id: { type: String, required: true, unique: true },
    variant_name: { type: String, required: true },
    description: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    car_id: { type: String, required: true, ref: 'Car' },
    exshowroom_price: { type: String, required: true },
    expectedExShowroomPrice: { type: String },
    expectedLaunchDate: { type: String },
    specification: { type: mongoose_1.Schema.Types.Mixed },
    is_published: { type: Boolean, default: false },
}, { timestamps: true });
exports.CarVariant = (0, mongoose_1.model)('CarVariant', variantSchema);
//# sourceMappingURL=car-variant.model.js.map