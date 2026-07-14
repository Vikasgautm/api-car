import { NextFunction, Request, Response } from 'express';
/**
 * Returns middleware that blocks the request with 503 if the named feature flag is off.
 * Reads from PlatformSettingsService (60s in-memory cache — no DB hit on hot paths).
 * Fails open: if settings cannot be loaded, the request passes through.
 */
export declare function requireFeatureEnabled(flagKey: string): (_req: Request, res: Response, next: NextFunction) => Promise<void>;
