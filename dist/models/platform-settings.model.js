"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlatformSettings = exports.SETTINGS_GROUPS = void 0;
const mongoose_1 = require("mongoose");
exports.SETTINGS_GROUPS = [
    'general',
    'seo',
    'imports',
    'ai_intelligence',
    'lifecycle_publishing',
    'media',
    'performance',
    'security',
    'feature_flags',
    'audit_logs',
];
const platformSettingsSchema = new mongoose_1.Schema({
    group: {
        type: String,
        required: true,
        unique: true,
        enum: exports.SETTINGS_GROUPS,
    },
    data: { type: mongoose_1.Schema.Types.Mixed, required: true, default: {} },
    updated_by: { type: String },
    updated_at: { type: Date, default: Date.now },
}, { timestamps: true });
platformSettingsSchema.index({ group: 1 });
exports.PlatformSettings = (0, mongoose_1.model)('PlatformSettings', platformSettingsSchema);
//# sourceMappingURL=platform-settings.model.js.map