"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireFeatureEnabled = requireFeatureEnabled;
const platform_settings_service_1 = require("../modules/settings/services/platform-settings.service");
/**
 * Returns middleware that blocks the request with 503 if the named feature flag is off.
 * Reads from PlatformSettingsService (60s in-memory cache — no DB hit on hot paths).
 * Fails open: if settings cannot be loaded, the request passes through.
 */
function requireFeatureEnabled(flagKey) {
    return async (_req, res, next) => {
        try {
            const flags = await platform_settings_service_1.PlatformSettingsService.getSettingsByGroup('feature_flags');
            if (flags[flagKey] === false) {
                res.status(503).json({
                    success: false,
                    message: `Feature '${flagKey}' is currently disabled. Enable it in Settings → Feature Flags.`,
                    code: 'FEATURE_DISABLED',
                });
                return;
            }
        }
        catch {
            // Settings unavailable — fail open rather than blocking all requests.
        }
        next();
    };
}
