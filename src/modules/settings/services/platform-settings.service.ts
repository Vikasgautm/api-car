import { PlatformSettings, SettingsGroup, SETTINGS_GROUPS } from '../../../models/platform-settings.model';
import { SettingsHistory } from '../../../models/settings-history.model';
import { SETTINGS_DEFAULTS, SUPER_ADMIN_ONLY_GROUPS } from '../constants/settings.constants';
import { validateSettingsData } from '../validators/settings.validator';
import { AppError } from '../../../shared/utils/app-error.util';

// In-memory settings cache (group → data, expires in 60s)
interface CacheEntry { data: Record<string, any>; expiresAt: number }
const settingsCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60_000;

function cacheGet(group: string): Record<string, any> | null {
  const e = settingsCache.get(group);
  if (!e || Date.now() > e.expiresAt) { settingsCache.delete(group); return null; }
  return e.data;
}

function cacheSet(group: string, data: Record<string, any>): void {
  settingsCache.set(group, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

function cacheInvalidate(group?: string): void {
  if (!group) { settingsCache.clear(); return; }
  settingsCache.delete(group);
}

function deepDiff(oldVal: any, newVal: any): Array<{ key: string; old: any; new: any }> {
  const changes: Array<{ key: string; old: any; new: any }> = [];
  const allKeys = new Set([...Object.keys(oldVal || {}), ...Object.keys(newVal || {})]);
  for (const key of allKeys) {
    const a = JSON.stringify(oldVal?.[key]);
    const b = JSON.stringify(newVal?.[key]);
    if (a !== b) changes.push({ key, old: oldVal?.[key], new: newVal?.[key] });
  }
  return changes;
}

export class PlatformSettingsService {

  static async ensureDefaults(): Promise<void> {
    for (const group of SETTINGS_GROUPS) {
      const existing = await PlatformSettings.findOne({ group });
      if (!existing) {
        await PlatformSettings.create({
          group,
          data: { ...SETTINGS_DEFAULTS[group] },
          updated_at: new Date(),
        });
      }
    }
  }

  static async getAllSettings(): Promise<Record<SettingsGroup, Record<string, any>>> {
    await PlatformSettingsService.ensureDefaults();
    const all = await PlatformSettings.find({}).lean();
    const result: Record<string, Record<string, any>> = {};
    for (const doc of all) {
      result[doc.group] = { ...SETTINGS_DEFAULTS[doc.group as SettingsGroup], ...doc.data };
    }
    return result as Record<SettingsGroup, Record<string, any>>;
  }

  static async getSettingsByGroup(group: SettingsGroup): Promise<Record<string, any>> {
    const cached = cacheGet(group);
    if (cached) return cached;

    const doc = await PlatformSettings.findOne({ group }).lean();
    if (!doc) {
      await PlatformSettingsService.ensureDefaults();
      const created = await PlatformSettings.findOne({ group }).lean();
      const data = { ...SETTINGS_DEFAULTS[group], ...(created?.data || {}) };
      cacheSet(group, data);
      return data;
    }
    const data = { ...SETTINGS_DEFAULTS[group], ...doc.data };
    cacheSet(group, data);
    return data;
  }

  static async updateSettingsByGroup(
    group: SettingsGroup,
    updates: Record<string, any>,
    actorId: string,
    actorName?: string
  ): Promise<Record<string, any>> {
    const validation = validateSettingsData(group, updates);
    if (!validation.valid) {
      throw AppError.validation(`Settings validation failed: ${validation.errors.join(', ')}`, validation.errors);
    }

    await PlatformSettingsService.ensureDefaults();
    const existing = await PlatformSettings.findOne({ group });
    const oldData = { ...SETTINGS_DEFAULTS[group], ...(existing?.data || {}) };

    const newData = { ...oldData, ...updates };

    await PlatformSettings.findOneAndUpdate(
      { group },
      { data: newData, updated_by: actorId, updated_at: new Date() },
      { upsert: true, new: true }
    );

    const changes = deepDiff(oldData, newData);
    if (changes.length > 0) {
      await SettingsHistory.create({
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

  static async resetGroupToDefault(
    group: SettingsGroup,
    actorId: string,
    actorName?: string
  ): Promise<Record<string, any>> {
    const existing = await PlatformSettings.findOne({ group });
    const oldData = existing?.data || {};

    const defaultData = { ...SETTINGS_DEFAULTS[group] };
    await PlatformSettings.findOneAndUpdate(
      { group },
      { data: defaultData, updated_by: actorId, updated_at: new Date() },
      { upsert: true, new: true }
    );

    await SettingsHistory.create({
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

  static async exportSettings(): Promise<Record<string, any>> {
    const all = await PlatformSettingsService.getAllSettings();
    return {
      exported_at: new Date().toISOString(),
      version: '1.0',
      settings: all,
    };
  }

  static async importSettings(
    payload: { settings: Record<string, any> },
    actorId: string,
    actorName?: string
  ): Promise<{ imported: string[]; errors: string[] }> {
    const imported: string[] = [];
    const errors: string[] = [];

    for (const group of SETTINGS_GROUPS) {
      if (!payload.settings[group]) continue;
      try {
        await PlatformSettingsService.updateSettingsByGroup(
          group,
          payload.settings[group],
          actorId,
          actorName
        );
        imported.push(group);
      } catch (err: any) {
        errors.push(`${group}: ${err.message}`);
      }
    }

    return { imported, errors };
  }

  static async getHistory(
    group?: string,
    limit = 50,
    skip = 0
  ): Promise<{ items: any[]; total: number }> {
    const query = group ? { group } : {};
    const [items, total] = await Promise.all([
      SettingsHistory.find(query).sort({ updated_at: -1 }).skip(skip).limit(limit).lean(),
      SettingsHistory.countDocuments(query),
    ]);
    return { items, total };
  }

  static isSuperAdminOnly(group: SettingsGroup): boolean {
    return SUPER_ADMIN_ONLY_GROUPS.includes(group);
  }

  static invalidateCache(group?: SettingsGroup): void {
    cacheInvalidate(group);
  }

  static async getSystemStatus(): Promise<Record<string, any>> {
    let dbState = 'disconnected';
    try {
      const mongooseModule: any = await import('mongoose');
      const conn = mongooseModule.default?.connection || mongooseModule.connection;
      const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
      if (conn && typeof conn.readyState === 'number') {
        dbState = states[conn.readyState] || 'unknown';
      }
    } catch (e) {
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
