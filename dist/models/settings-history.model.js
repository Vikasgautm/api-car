"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsHistory = void 0;
const mongoose_1 = require("mongoose");
const settingsHistorySchema = new mongoose_1.Schema({
    group: { type: String, required: true, index: true },
    key: { type: String },
    old_value: { type: mongoose_1.Schema.Types.Mixed },
    new_value: { type: mongoose_1.Schema.Types.Mixed },
    updated_by: { type: String, required: true },
    updated_by_name: { type: String },
    updated_at: { type: Date, default: Date.now, index: true },
    change_summary: { type: String, required: true },
}, { timestamps: true });
settingsHistorySchema.index({ group: 1, updated_at: -1 });
exports.SettingsHistory = (0, mongoose_1.model)('SettingsHistory', settingsHistorySchema);
//# sourceMappingURL=settings-history.model.js.map