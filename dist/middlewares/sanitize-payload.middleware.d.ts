import { NextFunction, Request, Response } from 'express';
export declare const stripBackendManagedCarFields: (req: Request, _res: Response, next: NextFunction) => void;
/**
 * Sanitizes HTML-capable text fields on write requests (POST / PATCH).
 * Applies DOMPurify to strip XSS vectors while preserving safe markup.
 * Register on routes that accept car, variant, or blog write payloads.
 */
export declare const sanitizeHtmlFields: (req: Request, _res: Response, next: NextFunction) => void;
//# sourceMappingURL=sanitize-payload.middleware.d.ts.map