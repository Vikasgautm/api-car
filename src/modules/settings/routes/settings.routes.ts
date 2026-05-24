import { Router } from 'express';
import { protect, restrictTo } from '../../../middlewares/auth.middleware';
import { SettingsController } from '../controllers/settings.controller';
import { PlatformSettingsController } from '../controllers/platform-settings.controller';

const router = Router();

// ── Legacy routes (backward compatibility) ────────────────────────────────────
router.put('/theme', protect, SettingsController.updateTheme);
router.post('/theme', protect, SettingsController.updateTheme);
router.get('/seo', protect, SettingsController.getSEOSettings);
router.put('/seo', protect, restrictTo('admin', 'super_admin'), SettingsController.updateSEOSettings);
router.post('/seo', protect, restrictTo('admin', 'super_admin'), SettingsController.updateSEOSettings);

// ── Platform settings (new) ──────────────────────────────────────────────────
// System status (no super_admin restriction — both admin and super_admin)
router.get('/platform/status', protect, restrictTo('admin', 'super_admin'), PlatformSettingsController.getSystemStatus);

// History
router.get('/platform/history', protect, restrictTo('admin', 'super_admin'), PlatformSettingsController.getHistory);

// Export
router.post('/platform/export', protect, restrictTo('admin', 'super_admin'), PlatformSettingsController.exportSettings);

// Import (super_admin only — destructive)
router.post('/platform/import', protect, restrictTo('super_admin'), PlatformSettingsController.importSettings);

// Reset (super_admin only — destructive)
router.post('/platform/reset', protect, restrictTo('super_admin'), PlatformSettingsController.resetGroup);

// Test
router.post('/platform/test', protect, restrictTo('admin', 'super_admin'), PlatformSettingsController.testSetting);

// All groups (read)
router.get('/platform', protect, restrictTo('admin', 'super_admin'), PlatformSettingsController.getAll);

// Per-group (read + write) — controller enforces super_admin for sensitive groups
router.get('/platform/:group', protect, restrictTo('admin', 'super_admin'), PlatformSettingsController.getByGroup);
router.put('/platform/:group', protect, restrictTo('admin', 'super_admin'), PlatformSettingsController.updateByGroup);

export default router;
