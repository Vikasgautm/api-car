"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CarCompare = void 0;
const mongoose_1 = require("mongoose");
const carInfoSchema = new mongoose_1.Schema({
    brand: { type: String, required: true },
    model: { type: String, required: true },
    price_min: { type: Number, required: true },
    price_max: { type: Number, required: true },
}, { _id: false });
const carCompareSchema = new mongoose_1.Schema({
    car_compare_id: { type: String, required: true, unique: true },
    car1: { type: carInfoSchema, required: true },
    car2: { type: carInfoSchema, required: true },
    image: {
        type: [
            {
                preview: { type: String },
                title: { type: String },
            },
        ],
        required: true,
    },
    comparison_title: { type: String, required: true },
    route_link: { type: String, required: true },
    is_published: { type: Boolean, default: false },
}, { timestamps: true });
exports.CarCompare = (0, mongoose_1.model)('CarCompare', carCompareSchema);
//# sourceMappingURL=car-compare.model.js.map