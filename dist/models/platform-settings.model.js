"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlatformSettings = exports.SETTINGS_GROUPS = void 0;
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
const BaseModel_1 = require("../sql/common/BaseModel");
exports.PlatformSettings = new BaseModel_1.BaseModel('PlatformSettings', 'settings_id', ['settings_data']);
