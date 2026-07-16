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
exports.PlatformSettingsService = void 0;
const platform_settings_model_1 = require("../../../models/platform-settings.model");
const settings_history_model_1 = require("../../../models/settings-history.model");
const settings_constants_1 = require("../constants/settings.constants");
const settings_validator_1 = require("../validators/settings.validator");
const app_error_util_1 = require("../../../shared/utils/app-error.util");
const settingsCache = new Map();
const CACHE_TTL_MS = 60_000;
function cacheGet(group) {
    const e = settingsCache.get(group);
    if (!e || Date.now() > e.expiresAt) {
        settingsCache.delete(group);
        return null;
    }
    return e.data;
}
function cacheSet(group, data) {
    settingsCache.set(group, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}
function cacheInvalidate(group) {
    if (!group) {
        settingsCache.clear();
        return;
    }
    settingsCache.delete(group);
}
function deepDiff(oldVal, newVal) {
    const changes = [];
    const allKeys = new Set([...Object.keys(oldVal || {}), ...Object.keys(newVal || {})]);
    for (const key of allKeys) {
        const a = JSON.stringify(oldVal?.[key]);
        const b = JSON.stringify(newVal?.[key]);
        if (a !== b)
            changes.push({ key, old: oldVal?.[key], new: newVal?.[key] });
    }
    return changes;
}
class PlatformSettingsService {
    static async ensureDefaults() {
        for (const group of platform_settings_model_1.SETTINGS_GROUPS) {
            const existing = await platform_settings_model_1.PlatformSettings.findOne({ group });
            if (!existing) {
                await platform_settings_model_1.PlatformSettings.create({
                    group,
                    data: { ...settings_constants_1.SETTINGS_DEFAULTS[group] },
                    updated_at: new Date(),
                });
            }
        }
    }
    static async getAllSettings() {
        await PlatformSettingsService.ensureDefaults();
        const all = await platform_settings_model_1.PlatformSettings.find({}).lean();
        const result = {};
        for (const doc of all) {
            result[doc.group] = { ...settings_constants_1.SETTINGS_DEFAULTS[doc.group], ...doc.data };
        }
        return result;
    }
    static async getSettingsByGroup(group) {
        const cached = cacheGet(group);
        if (cached)
            return cached;
        const doc = await platform_settings_model_1.PlatformSettings.findOne({ group }).lean();
        if (!doc) {
            await PlatformSettingsService.ensureDefaults();
            const created = await platform_settings_model_1.PlatformSettings.findOne({ group }).lean();
            const data = { ...settings_constants_1.SETTINGS_DEFAULTS[group], ...(created?.data || {}) };
            cacheSet(group, data);
            return data;
        }
        const data = { ...settings_constants_1.SETTINGS_DEFAULTS[group], ...doc.data };
        cacheSet(group, data);
        return data;
    }
    static async updateSettingsByGroup(group, updates, actorId, actorName) {
        const validation = (0, settings_validator_1.validateSettingsData)(group, updates);
        if (!validation.valid) {
            throw app_error_util_1.AppError.validation(`Settings validation failed: ${validation.errors.join(', ')}`, validation.errors);
        }
        await PlatformSettingsService.ensureDefaults();
        const existing = await platform_settings_model_1.PlatformSettings.findOne({ group });
        const oldData = { ...settings_constants_1.SETTINGS_DEFAULTS[group], ...(existing?.data || {}) };
        const newData = { ...oldData, ...updates };
        await platform_settings_model_1.PlatformSettings.findOneAndUpdate({ group }, { data: newData, updated_by: actorId, updated_at: new Date() }, { upsert: true, new: true });
        const changes = deepDiff(oldData, newData);
        if (changes.length > 0) {
            await settings_history_model_1.SettingsHistory.create({
                group,
                old_value: oldData,
                new_value: newData,
                updated_by: actorId,
                updated_by_name: actorName,
                updated_at: new Date(),
                change_summary: `Updated ${changes.length} field(s): ${changes.map(c => c.key).join(', ')}`,
            });
        }
        cacheInvalidate(group);
        return newData;
    }
    static async resetGroupToDefault(group, actorId, actorName) {
        const existing = await platform_settings_model_1.PlatformSettings.findOne({ group });
        const oldData = existing?.data || {};
        const defaultData = { ...settings_constants_1.SETTINGS_DEFAULTS[group] };
        await platform_settings_model_1.PlatformSettings.findOneAndUpdate({ group }, { data: defaultData, updated_by: actorId, updated_at: new Date() }, { upsert: true, new: true });
        await settings_history_model_1.SettingsHistory.create({
            group,
            old_value: oldData,
            new_value: defaultData,
            updated_by: actorId,
            updated_by_name: actorName,
            updated_at: new Date(),
            change_summary: `Reset group "${group}" to default values`,
        });
        cacheInvalidate(group);
        return defaultData;
    }
    static async exportSettings() {
        const all = await PlatformSettingsService.getAllSettings();
        return {
            exported_at: new Date().toISOString(),
            version: '1.0',
            settings: all,
        };
    }
    static async importSettings(payload, actorId, actorName) {
        const imported = [];
        const errors = [];
        for (const group of platform_settings_model_1.SETTINGS_GROUPS) {
            if (!payload.settings[group])
                continue;
            try {
                await PlatformSettingsService.updateSettingsByGroup(group, payload.settings[group], actorId, actorName);
                imported.push(group);
            }
            catch (err) {
                errors.push(`${group}: ${err.message}`);
            }
        }
        return { imported, errors };
    }
    static async getHistory(group, limit = 50, skip = 0) {
        const query = group ? { group } : {};
        const [items, total] = await Promise.all([
            settings_history_model_1.SettingsHistory.find(query).sort({ updated_at: -1 }).skip(skip).limit(limit).lean(),
            settings_history_model_1.SettingsHistory.countDocuments(query),
        ]);
        return { items, total };
    }
    static isSuperAdminOnly(group) {
        return settings_constants_1.SUPER_ADMIN_ONLY_GROUPS.includes(group);
    }
    static invalidateCache(group) {
        cacheInvalidate(group);
    }
    static async getSystemStatus() {
        let dbState = 'disconnected';
        try {
            const mongooseModule = await Promise.resolve().then(() => __importStar(require('mongoose')));
            const conn = mongooseModule.default?.connection || mongooseModule.connection;
            const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
            if (conn && typeof conn.readyState === 'number') {
                dbState = states[conn.readyState] || 'unknown';
            }
        }
        catch (e) {
            dbState = 'disconnected';
        }
        return {
            backend: 'ok',
            mongodb: dbState,
            ai_provider: process.env.CEREBRAS_API_KEY ? 'configured' : 'not_configured',
            cloudinary: (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) ? 'configured' : 'not_configured',
            node_env: process.env.NODE_ENV || 'development',
            uptime_seconds: process.uptime(),
            timestamp: new Date().toISOString(),
        };
    }
}
exports.PlatformSettingsService = PlatformSettingsService;
