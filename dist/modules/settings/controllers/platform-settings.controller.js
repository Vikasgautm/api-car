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
exports.PlatformSettingsController = void 0;
const catchAsync_1 = require("../../../utils/catchAsync");
const app_error_util_1 = require("../../../shared/utils/app-error.util");
const response_util_1 = require("../../../shared/utils/response.util");
const platform_settings_service_1 = require("../services/platform-settings.service");
const platform_settings_model_1 = require("../../../models/platform-settings.model");
const settings_constants_1 = require("../constants/settings.constants");
const discovery_service_1 = require("../../discovery/services/discovery.service");
function getActorInfo(req) {
    const user = req.user;
    return {
        id: user?.user_id || user?.id || 'system',
        name: user?.name || user?.user_name || user?.email || 'unknown',
    };
}
class PlatformSettingsController {
    // GET /api/v1/settings/platform — all groups
    static getAll = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const all = await platform_settings_service_1.PlatformSettingsService.getAllSettings();
        return response_util_1.ResponseUtil.success(res, all, 'Settings retrieved successfully');
    });
    // GET /api/v1/settings/platform/:group
    static getByGroup = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const { group } = req.params;
        if (!platform_settings_model_1.SETTINGS_GROUPS.includes(group)) {
            throw new app_error_util_1.AppError(`Unknown settings group: ${group}`, 400);
        }
        const data = await platform_settings_service_1.PlatformSettingsService.getSettingsByGroup(group);
        return response_util_1.ResponseUtil.success(res, { group, label: settings_constants_1.SETTINGS_LABELS[group], data }, 'Settings retrieved');
    });
    // PUT /api/v1/settings/platform/:group
    static updateByGroup = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const { group } = req.params;
        if (!platform_settings_model_1.SETTINGS_GROUPS.includes(group)) {
            throw new app_error_util_1.AppError(`Unknown settings group: ${group}`, 400);
        }
        const actor = getActorInfo(req);
        const userRole = req.user?.role;
        if (platform_settings_service_1.PlatformSettingsService.isSuperAdminOnly(group) && userRole !== 'super_admin') {
            throw new app_error_util_1.AppError('This settings group requires super_admin access', 403);
        }
        const updated = await platform_settings_service_1.PlatformSettingsService.updateSettingsByGroup(group, req.body, actor.id, actor.name);
        return response_util_1.ResponseUtil.updated(res, { group, data: updated }, 'Settings updated successfully');
    });
    // POST /api/v1/settings/platform/reset — body: { group }
    static resetGroup = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const { group } = req.body;
        if (!group || !platform_settings_model_1.SETTINGS_GROUPS.includes(group)) {
            throw new app_error_util_1.AppError('Valid group name is required', 400);
        }
        const actor = getActorInfo(req);
        const defaults = await platform_settings_service_1.PlatformSettingsService.resetGroupToDefault(group, actor.id, actor.name);
        return response_util_1.ResponseUtil.success(res, { group, data: defaults }, 'Settings reset to defaults');
    });
    // POST /api/v1/settings/platform/export
    static exportSettings = (0, catchAsync_1.catchAsync)(async (_req, res) => {
        const exported = await platform_settings_service_1.PlatformSettingsService.exportSettings();
        return response_util_1.ResponseUtil.success(res, exported, 'Settings exported successfully');
    });
    // POST /api/v1/settings/platform/import
    static importSettings = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const { settings } = req.body;
        if (!settings || typeof settings !== 'object') {
            throw new app_error_util_1.AppError('settings object is required in request body', 400);
        }
        const actor = getActorInfo(req);
        const result = await platform_settings_service_1.PlatformSettingsService.importSettings({ settings }, actor.id, actor.name);
        return response_util_1.ResponseUtil.success(res, result, 'Settings import completed');
    });
    // GET /api/v1/settings/platform/history
    static getHistory = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const group = req.query.group;
        const limit = Math.min(Number(req.query.limit) || 50, 200);
        const skip = Number(req.query.skip) || 0;
        const { items, total } = await platform_settings_service_1.PlatformSettingsService.getHistory(group, limit, skip);
        return response_util_1.ResponseUtil.success(res, { items, total, limit, skip }, 'Settings history retrieved');
    });
    // POST /api/v1/settings/platform/test — body: { type, ... }
    static testSetting = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const { type } = req.body;
        const results = {};
        switch (type) {
            case 'ai':
                results.ai = process.env.CEREBRAS_API_KEY
                    ? { status: 'ok', message: 'API key is configured' }
                    : { status: 'error', message: 'CEREBRAS_API_KEY not configured' };
                break;
            case 'cloudinary':
                results.cloudinary = (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY)
                    ? { status: 'ok', message: 'Cloudinary credentials configured' }
                    : { status: 'error', message: 'Cloudinary credentials not configured' };
                break;
            case 'mongodb':
                const mongoose = await Promise.resolve().then(() => __importStar(require('mongoose')));
                results.mongodb = mongoose.connection.readyState === 1
                    ? { status: 'ok', message: 'MongoDB connected' }
                    : { status: 'error', message: 'MongoDB not connected' };
                break;
            case 'cache_clear':
                platform_settings_service_1.PlatformSettingsService.invalidateCache();
                (0, discovery_service_1.clearDiscoveryFacetCache)();
                results.cache_clear = { status: 'ok', message: 'Settings and discovery facet caches cleared' };
                break;
            case 'status':
                results.status = await platform_settings_service_1.PlatformSettingsService.getSystemStatus();
                break;
            default:
                results.error = `Unknown test type: ${type}`;
        }
        return response_util_1.ResponseUtil.success(res, results, 'Test completed');
    });
    // GET /api/v1/settings/platform/status
    static getSystemStatus = (0, catchAsync_1.catchAsync)(async (_req, res) => {
        const status = await platform_settings_service_1.PlatformSettingsService.getSystemStatus();
        return response_util_1.ResponseUtil.success(res, status, 'System status retrieved');
    });
}
exports.PlatformSettingsController = PlatformSettingsController;
//# sourceMappingURL=platform-settings.controller.js.map