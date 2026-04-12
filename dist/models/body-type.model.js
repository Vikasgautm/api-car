"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BodyType = void 0;
const mongoose_1 = require("mongoose");
const bodyTypeSchema = new mongoose_1.Schema({
    body_type_id: { type: String, unique: true, required: true },
    body_type_name: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String },
    is_published: { type: Boolean, default: false },
    is_deleted: { type: Boolean, default: false },
}, { timestamps: true });
exports.BodyType = (0, mongoose_1.model)('BodyType', bodyTypeSchema);
//# sourceMappingURL=body-type.model.js.map