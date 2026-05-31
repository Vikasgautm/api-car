import { NextFunction, Request, Response } from 'express';
import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

// Initialise DOMPurify with a server-side DOM (jsdom).
// Both packages are already present in package.json.
const jsdomWindow = new JSDOM('').window;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const DOMPurify = createDOMPurify(jsdomWindow as any);

// Fields that are written by dedicated workflows (lifecycle transitions,
// deletion-approval, audit, Mongoose internals) and must never accept inbound
// values on generic update endpoints. Stripping them upstream of strict zod
// schemas keeps the schemas clean while letting clients safely echo back the
// full entity when convenient.
const CAR_MANAGED_FIELDS = [
  'archived_at', 'archived_by',
  'disabled_at', 'disabled_by',
  'discontinued_at', 'discontinued_by',
  'is_deleted', 'deleted_at', 'deleted_by',
  'entity_lifecycle_state', 'lifecycle_state_changed_at', 'lifecycle_state_changed_by',
  'redirect_to_slug',
  'created_at', 'updated_at',
  '_id', '__v', 'id',
];

// HTML-capable fields that editors can populate via rich-text editors (Jodit etc).
// DOMPurify strips <script> tags and JS event handlers before the value reaches
// the service layer, preventing stored XSS if the admin frontend ever renders
// these fields with dangerouslySetInnerHTML.
const HTML_SANITIZE_FIELDS = [
  'description',
  'short_description',
  'meta_description',
  'content',
  'variant_highlights',
];

export const stripBackendManagedCarFields = (req: Request, _res: Response, next: NextFunction) => {
  if (req.body && typeof req.body === 'object' && !Array.isArray(req.body)) {
    for (const field of CAR_MANAGED_FIELDS) {
      if (field in req.body) delete req.body[field];
    }
  }
  next();
};

/**
 * Sanitizes HTML-capable text fields on write requests (POST / PATCH).
 * Applies DOMPurify to strip XSS vectors while preserving safe markup.
 * Register on routes that accept car, variant, or blog write payloads.
 */
export const sanitizeHtmlFields = (req: Request, _res: Response, next: NextFunction) => {
  if (req.body && typeof req.body === 'object' && !Array.isArray(req.body)) {
    for (const field of HTML_SANITIZE_FIELDS) {
      if (typeof req.body[field] === 'string') {
        req.body[field] = DOMPurify.sanitize(req.body[field]);
      }
      // Handle array fields like variant_highlights (array of strings)
      if (Array.isArray(req.body[field])) {
        req.body[field] = (req.body[field] as unknown[]).map((item) =>
          typeof item === 'string' ? DOMPurify.sanitize(item) : item
        );
      }
    }
  }
  next();
};

