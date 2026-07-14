"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../../middlewares/auth.middleware");
const settings_controller_1 = require("../controllers/settings.controller");
const platform_settings_controller_1 = require("../controllers/platform-settings.controller");
const router = (0, express_1.Router)();
// ── Legacy routes (backward compatibility) ────────────────────────────────────
router.put('/theme', auth_middleware_1.protect, settings_controller_1.SettingsController.updateTheme);
router.post('/theme', auth_middleware_1.protect, settings_controller_1.SettingsController.updateTheme);
router.get('/seo', auth_middleware_1.protect, settings_controller_1.SettingsController.getSEOSettings);
router.put('/seo', auth_middleware_1.protect, (0, auth_middleware_1.restrictTo)('admin', 'super_admin'), settings_controller_1.SettingsController.updateSEOSettings);
router.post('/seo', auth_middleware_1.protect, (0, auth_middleware_1.restrictTo)('admin', 'super_admin'), settings_controller_1.SettingsController.updateSEOSettings);
// ── Platform settings (new) ──────────────────────────────────────────────────
// System status (no super_admin restriction — both admin and super_admin)
router.get('/platform/status', auth_middleware_1.protect, (0, auth_middleware_1.restrictTo)('admin', 'super_admin'), platform_settings_controller_1.PlatformSettingsController.getSystemStatus);
// History
router.get('/platform/history', auth_middleware_1.protect, (0, auth_middleware_1.restrictTo)('admin', 'super_admin'), platform_settings_controller_1.PlatformSettingsController.getHistory);
// Export
router.post('/platform/export', auth_middleware_1.protect, (0, auth_middleware_1.restrictTo)('admin', 'super_admin'), platform_settings_controller_1.PlatformSettingsController.exportSettings);
// Import (super_admin only — destructive)
router.post('/platform/import', auth_middleware_1.protect, (0, auth_middleware_1.restrictTo)('super_admin'), platform_settings_controller_1.PlatformSettingsController.importSettings);
// Reset (super_admin only — destructive)
router.post('/platform/reset', auth_middleware_1.protect, (0, auth_middleware_1.restrictTo)('super_admin'), platform_settings_controller_1.PlatformSettingsController.resetGroup);
// Test
router.post('/platform/test', auth_middleware_1.protect, (0, auth_middleware_1.restrictTo)('admin', 'super_admin'), platform_settings_controller_1.PlatformSettingsController.testSetting);
// All groups (read)
router.get('/platform', auth_middleware_1.protect, (0, auth_middleware_1.restrictTo)('admin', 'super_admin'), platform_settings_controller_1.PlatformSettingsController.getAll);
// Per-group (read + write) — controller enforces super_admin for sensitive groups
router.get('/platform/:group', auth_middleware_1.protect, (0, auth_middleware_1.restrictTo)('admin', 'super_admin'), platform_settings_controller_1.PlatformSettingsController.getByGroup);
router.put('/platform/:group', auth_middleware_1.protect, (0, auth_middleware_1.restrictTo)('admin', 'super_admin'), platform_settings_controller_1.PlatformSettingsController.updateByGroup);
exports.default = router;
