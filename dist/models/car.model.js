"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Car = void 0;
const mongoose_1 = require("mongoose");
const carSchema = new mongoose_1.Schema({
    car_id: { type: String, required: true, unique: true },
    car_name: { type: String, required: true },
    description: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    brand_id: { type: String, ref: 'Brand', required: true },
    body_type_id: { type: String, ref: 'BodyType', required: true },
    thumbnail: {
        type: {
            preview: { type: String },
            title: { type: String },
        },
        required: true,
    },
    images: {
        type: [
            {
                preview: { type: String },
                title: { type: String },
            },
        ],
        required: true,
    },
    link: { type: String, required: true },
    upcoming: { type: Boolean, default: false },
    recommended: { type: Boolean, default: false },
    popular: { type: Boolean, default: false },
    latest: { type: Boolean, default: true },
    electric: { type: Boolean, default: false },
    is_published: { type: Boolean, default: false },
    is_deleted: { type: Boolean, default: false },
}, { timestamps: true });
exports.Car = (0, mongoose_1.model)('Car', carSchema);
//# sourceMappingURL=car.model.js.map