"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.City = void 0;
const mongoose_1 = require("mongoose");
const citySchema = new mongoose_1.Schema({
    city_uuid: { type: String, required: true, unique: true },
    city_name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    state: { type: String, required: true },
    pincode: { type: Number, required: true },
    longitude: { type: Number, required: true },
    latitude: { type: Number, required: true },
    city_logo: { type: String },
    is_deleted: { type: Boolean, default: false },
}, { timestamps: true });
exports.City = (0, mongoose_1.model)('City', citySchema);
//# sourceMappingURL=city.model.js.map