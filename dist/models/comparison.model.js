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
exports.Comparison = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const uuid_1 = require("uuid");
const ComparisonSchema = new mongoose_1.Schema({
    comparison_id: {
        type: String,
        default: () => (0, uuid_1.v4)(),
        unique: true,
        index: true,
    },
    car1_id: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'Car',
        required: true,
        index: true,
    },
    car2_id: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'Car',
        required: true,
        index: true,
    },
    variant1_id: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'CarVariant',
        index: true,
    },
    variant2_id: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'CarVariant',
        index: true,
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true,
    },
    title: {
        type: String,
        required: true,
        trim: true,
    },
    category: {
        type: String,
        enum: ['suv', 'sedan', 'hatchback', 'coupe', 'mpv', 'ev', 'luxury', 'budget', 'mid_range'],
        index: true,
    },
    description: String,
    compareIntroContent: String,
    isPopular: {
        type: Boolean,
        default: false,
        index: true,
    },
    isTrending: {
        type: Boolean,
        default: false,
        index: true,
    },
    showOnHomepage: {
        type: Boolean,
        default: false,
        index: true,
    },
    relatedComparisons: [{
            type: mongoose_1.default.Schema.Types.ObjectId,
            ref: 'Comparison',
        }],
    seoMetaTitle: String,
    seoMetaDescription: String,
    seoFAQSchema: mongoose_1.default.Schema.Types.Mixed,
    status: {
        type: String,
        enum: ['draft', 'published', 'archived'],
        default: 'draft',
        index: true,
    },
    is_published: {
        type: Boolean,
        default: false,
        index: true,
    },
    created_by: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    updated_by: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
    },
    is_deleted: {
        type: Boolean,
        default: false,
        index: true,
    },
    deleted_at: Date,
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});
// Indexes for performance
ComparisonSchema.index({ status: 1, is_published: 1 });
ComparisonSchema.index({ isPopular: 1, status: 1 });
ComparisonSchema.index({ category: 1, status: 1 });
ComparisonSchema.index({ slug: 1 });
ComparisonSchema.index({ car1_id: 1, car2_id: 1 });
ComparisonSchema.index({ is_deleted: 1 });
exports.Comparison = mongoose_1.default.model('Comparison', ComparisonSchema);
//# sourceMappingURL=comparison.model.js.map