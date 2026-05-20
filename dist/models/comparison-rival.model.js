"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComparisonRival = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const uuid_1 = require("uuid");
const ComparisonRivalSchema = new mongoose_1.Schema({
    rival_id: {
        type: String,
        default: () => (0, uuid_1.v4)(),
        unique: true,
        index: true,
    },
    primary_car_id: {
        type: String,
        required: true,
        index: true,
    },
    rival_car_id: {
        type: String,
        required: true,
        index: true,
    },
    relationship_strength: {
        type: Number,
        default: 1,
        min: 0,
        max: 100,
    },
    primary_segment: String,
    rival_segment: String,
    price_proximity: Number,
    manual_mapping: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});
// Compound index to prevent duplicate rivalries in same direction
ComparisonRivalSchema.index({ primary_car_id: 1, rival_car_id: 1 }, { unique: true });
ComparisonRivalSchema.index({ rival_car_id: 1, primary_car_id: 1 });
ComparisonRivalSchema.index({ relationship_strength: -1 });
exports.ComparisonRival = mongoose_1.default.model('ComparisonRival', ComparisonRivalSchema);
//# sourceMappingURL=comparison-rival.model.js.map