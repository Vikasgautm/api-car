import { NextFunction, Request, Response } from 'express';
import { PlatformSettingsService } from '../modules/settings/services/platform-settings.service';

/**
 * Returns middleware that blocks the request with 503 if the named feature flag is off.
 * Reads from PlatformSettingsService (60s in-memory cache — no DB hit on hot paths).
 * Fails open: if settings cannot be loaded, the request passes through.
 */
export function requireFeatureEnabled(flagKey: string) {
  return async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const flags = await PlatformSettingsService.getSettingsByGroup('feature_flags') as Record<string, unknown>;
      if (flags[flagKey] === false) {
        res.status(503).json({
          success: false,
          message: `Feature '${flagKey}' is currently disabled. Enable it in Settings → Feature Flags.`,
          code: 'FEATURE_DISABLED',
        });
        return;
      }
    } catch {
      // Settings unavailable — fail open rather than blocking all requests.
    }
    next();
  };
}
