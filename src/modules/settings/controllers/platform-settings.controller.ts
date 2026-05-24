import { Request, Response } from 'express';
import { catchAsync } from '../../../utils/catchAsync';
import { AppError } from '../../../shared/utils/app-error.util';
import { ResponseUtil } from '../../../shared/utils/response.util';
import { PlatformSettingsService } from '../services/platform-settings.service';
import { SETTINGS_GROUPS, SettingsGroup } from '../../../models/platform-settings.model';
import { SETTINGS_LABELS } from '../constants/settings.constants';
import { clearDiscoveryFacetCache } from '../../discovery/services/discovery.service';

function getActorInfo(req: Request): { id: string; name: string } {
  const user = (req as any).user;
  return {
    id: user?.user_id || user?.id || 'system',
    name: user?.name || user?.user_name || user?.email || 'unknown',
  };
}

export class PlatformSettingsController {
  // GET /api/v1/settings/platform — all groups
  static getAll = catchAsync(async (req: Request, res: Response) => {
    const all = await PlatformSettingsService.getAllSettings();
    return ResponseUtil.success(res, all, 'Settings retrieved successfully');
  });

  // GET /api/v1/settings/platform/:group
  static getByGroup = catchAsync(async (req: Request, res: Response) => {
    const { group } = req.params;
    if (!SETTINGS_GROUPS.includes(group as SettingsGroup)) {
      throw new AppError(`Unknown settings group: ${group}`, 400);
    }
    const data = await PlatformSettingsService.getSettingsByGroup(group as SettingsGroup);
    return ResponseUtil.success(res, { group, label: SETTINGS_LABELS[group as SettingsGroup], data }, 'Settings retrieved');
  });

  // PUT /api/v1/settings/platform/:group
  static updateByGroup = catchAsync(async (req: Request, res: Response) => {
    const { group } = req.params;
    if (!SETTINGS_GROUPS.includes(group as SettingsGroup)) {
      throw new AppError(`Unknown settings group: ${group}`, 400);
    }

    const actor = getActorInfo(req);
    const userRole = (req as any).user?.role;

    if (PlatformSettingsService.isSuperAdminOnly(group as SettingsGroup) && userRole !== 'super_admin') {
      throw new AppError('This settings group requires super_admin access', 403);
    }

    const updated = await PlatformSettingsService.updateSettingsByGroup(
      group as SettingsGroup,
      req.body,
      actor.id,
      actor.name
    );
    return ResponseUtil.updated(res, { group, data: updated }, 'Settings updated successfully');
  });

  // POST /api/v1/settings/platform/reset — body: { group }
  static resetGroup = catchAsync(async (req: Request, res: Response) => {
    const { group } = req.body;
    if (!group || !SETTINGS_GROUPS.includes(group as SettingsGroup)) {
      throw new AppError('Valid group name is required', 400);
    }
    const actor = getActorInfo(req);
    const defaults = await PlatformSettingsService.resetGroupToDefault(group as SettingsGroup, actor.id, actor.name);
    return ResponseUtil.success(res, { group, data: defaults }, 'Settings reset to defaults');
  });

  // POST /api/v1/settings/platform/export
  static exportSettings = catchAsync(async (_req: Request, res: Response) => {
    const exported = await PlatformSettingsService.exportSettings();
    return ResponseUtil.success(res, exported, 'Settings exported successfully');
  });

  // POST /api/v1/settings/platform/import
  static importSettings = catchAsync(async (req: Request, res: Response) => {
    const { settings } = req.body;
    if (!settings || typeof settings !== 'object') {
      throw new AppError('settings object is required in request body', 400);
    }
    const actor = getActorInfo(req);
    const result = await PlatformSettingsService.importSettings({ settings }, actor.id, actor.name);
    return ResponseUtil.success(res, result, 'Settings import completed');
  });

  // GET /api/v1/settings/platform/history
  static getHistory = catchAsync(async (req: Request, res: Response) => {
    const group = req.query.group as string | undefined;
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const skip = Number(req.query.skip) || 0;
    const { items, total } = await PlatformSettingsService.getHistory(group, limit, skip);
    return ResponseUtil.success(res, { items, total, limit, skip }, 'Settings history retrieved');
  });

  // POST /api/v1/settings/platform/test — body: { type, ... }
  static testSetting = catchAsync(async (req: Request, res: Response) => {
    const { type } = req.body;
    const results: Record<string, any> = {};

    switch (type) {
      case 'ai':
        results.ai = process.env.ANTHROPIC_API_KEY
          ? { status: 'ok', message: 'API key is configured' }
          : { status: 'error', message: 'ANTHROPIC_API_KEY not configured' };
        break;
      case 'cloudinary':
        results.cloudinary = (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY)
          ? { status: 'ok', message: 'Cloudinary credentials configured' }
          : { status: 'error', message: 'Cloudinary credentials not configured' };
        break;
      case 'mongodb':
        const mongoose = await import('mongoose');
        results.mongodb = mongoose.connection.readyState === 1
          ? { status: 'ok', message: 'MongoDB connected' }
          : { status: 'error', message: 'MongoDB not connected' };
        break;
      case 'cache_clear':
        PlatformSettingsService.invalidateCache();
        clearDiscoveryFacetCache();
        results.cache_clear = { status: 'ok', message: 'Settings and discovery facet caches cleared' };
        break;
      case 'status':
        results.status = await PlatformSettingsService.getSystemStatus();
        break;
      default:
        results.error = `Unknown test type: ${type}`;
    }

    return ResponseUtil.success(res, results, 'Test completed');
  });

  // GET /api/v1/settings/platform/status
  static getSystemStatus = catchAsync(async (_req: Request, res: Response) => {
    const status = await PlatformSettingsService.getSystemStatus();
    return ResponseUtil.success(res, status, 'System status retrieved');
  });
}
