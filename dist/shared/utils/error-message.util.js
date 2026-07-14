"use strict";
/**
 * Error Message Formatter
 * ------------------------
 * Converts raw framework / driver error messages (Mongoose, Zod, Mongo,
 * JWT, Multer, etc.) into clean, user-friendly strings.
 *
 * Goals:
 *  - Never expose raw Mongoose / Zod / Node internals to the user.
 *  - Produce readable field names ("description" -> "Description").
 *  - Keep technical details available for logs (the caller decides what to log).
 *
 * This util is intentionally framework-agnostic and side-effect free so it can
 * be unit-tested in isolation and reused by the error middleware.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatFieldName = formatFieldName;
exports.cleanValidationMessage = cleanValidationMessage;
exports.normalizeErrors = normalizeErrors;
exports.getUserFriendlyMessage = getUserFriendlyMessage;
/**
 * Known field-name overrides where the generic algorithm would produce an
 * awkward label (acronyms, *_id foreign keys with friendlier names, etc.).
 */
const FIELD_LABEL_OVERRIDES = {
    id: 'ID',
    _id: 'ID',
    brand_id: 'Brand',
    body_type_id: 'Body Type',
    fuel_type_id: 'Fuel Type',
    car_id: 'Car',
    variant_id: 'Variant',
    predecessor_car_id: 'Predecessor Car',
    successor_car_id: 'Successor Car',
    meta_title: 'Meta Title',
    meta_description: 'Meta Description',
    meta_keywords: 'Meta Keywords',
    og_image: 'OG Image',
    canonical_url: 'Canonical URL',
    url: 'URL',
    seo: 'SEO',
    faq: 'FAQ',
    user_name: 'Username',
    email: 'Email',
};
/**
 * Tokens that should be upper-cased entirely when title-casing a field name.
 */
const ACRONYMS = new Set(['id', 'url', 'seo', 'faq', 'og', 'ncap', 'ev', 'v2l', 'v2v', 'adas', 'api']);
/**
 * Convert a raw field key into a human-readable label.
 *
 *   description    -> Description
 *   variant_name   -> Variant Name
 *   brand_id       -> Brand
 *   body_type_id   -> Body Type
 *   fuel_type_id   -> Fuel Type
 *   model_year     -> Model Year
 *   meta_description -> Meta Description
 */
function formatKey(key) {
    if (FIELD_LABEL_OVERRIDES[key])
        return FIELD_LABEL_OVERRIDES[key];
    let tokens = key
        .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
        .split(/[_\s]+/)
        .filter(Boolean);
    if (tokens.length > 1 && tokens[tokens.length - 1].toLowerCase() === 'id') {
        tokens = tokens.slice(0, -1);
    }
    if (tokens.length === 0)
        return 'Field';
    return tokens
        .map((t) => {
        const lower = t.toLowerCase();
        if (ACRONYMS.has(lower))
            return lower.toUpperCase();
        return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
        .join(' ');
}
function formatFieldName(field) {
    if (!field)
        return 'Field';
    const segments = String(field).split('.');
    let key = segments[segments.length - 1];
    // When the last segment is a numeric array index (e.g. "urls.0", "body.items.2"),
    // use the nearest non-numeric parent as the label so we get "URL 1" not "0".
    if (/^\d+$/.test(key)) {
        const idx = parseInt(key, 10);
        const parentKey = [...segments].reverse().find((s) => !/^\d+$/.test(s));
        if (parentKey) {
            return `${formatKey(parentKey)} ${idx + 1}`;
        }
        return `Item ${idx + 1}`;
    }
    return formatKey(key);
}
/**
 * Convert a Mongoose-style validation message into a clean sentence.
 *
 *   Path `description` is required.   -> Description is required
 *   Path `variant_name` is required.  -> Variant Name is required
 *   `description` is required         -> Description is required
 *   description is required           -> Description is required
 */
function cleanValidationMessage(message) {
    if (!message)
        return '';
    let msg = String(message).trim();
    // Strip Mongoose "Path " prefix and trailing period.
    msg = msg.replace(/^Path\s+/i, '').replace(/\.\s*$/, '');
    // Replace any `field` backtick tokens with friendly labels.
    msg = msg.replace(/`([^`]+)`/g, (_, f) => formatFieldName(f));
    // If the sentence still starts with a raw snake_case/lowercase field key,
    // promote it to a friendly label ("description is required" -> "Description...").
    const leading = msg.match(/^([a-z][a-z0-9]*(?:_[a-z0-9]+)*)\b/);
    if (leading) {
        msg = formatFieldName(leading[1]) + msg.slice(leading[1].length);
    }
    return msg.replace(/\s+/g, ' ').trim();
}
/**
 * Combine a field key + a (possibly terse) message into one clean sentence.
 *   ("variant_name", "Required") -> "Variant Name is required"
 *   ("email", "Invalid email")   -> "Email is invalid"
 */
function combineFieldMessage(field, message) {
    const label = formatFieldName(field);
    const raw = (message || '').trim();
    const lower = raw.toLowerCase();
    if (!raw || lower === 'required' || lower === 'is required' || lower.includes('is required')) {
        return `${label} is required`;
    }
    if (lower === 'required field' || lower === 'this field is required') {
        return `${label} is required`;
    }
    if (lower === 'invalid' || lower === 'invalid input') {
        return `${label} is invalid`;
    }
    if (lower === 'invalid url' || lower === 'invalid_url') {
        return `${label} must be a valid URL (e.g. https://www.cardekho.com/...)`;
    }
    if (lower === 'invalid email') {
        return `${label} must be a valid email address`;
    }
    if (lower.startsWith('invalid ')) {
        return `${label} is invalid`;
    }
    // If the message already reads like a full sentence referencing the field,
    // clean it as-is; otherwise prefix the label.
    if (/^[A-Z]/.test(raw) && raw.toLowerCase().includes(label.toLowerCase())) {
        return cleanValidationMessage(raw);
    }
    return `${label} ${raw}`.replace(/\s+/g, ' ').trim();
}
/**
 * Normalize any "errors" payload into a clean string[] for the API response.
 *
 * Supports:
 *  - string[]
 *  - { field, message }[]  (and { path, message }[])
 *  - Zod issue array
 *  - Mongoose ValidationError.errors object map
 *  - unknown fallback
 */
function normalizeErrors(errors) {
    if (errors == null)
        return [];
    // Array forms
    if (Array.isArray(errors)) {
        return errors
            .map((e) => {
            if (e == null)
                return '';
            if (typeof e === 'string')
                return cleanValidationMessage(e);
            const obj = e;
            const field = obj.field ?? (Array.isArray(obj.path) ? obj.path.join('.') : obj.path);
            if (field != null && field !== '') {
                return combineFieldMessage(String(field), obj.message);
            }
            if (typeof obj.message === 'string')
                return cleanValidationMessage(obj.message);
            return '';
        })
            .filter(Boolean);
    }
    // Zod error object (has .issues)
    const anyErr = errors;
    if (Array.isArray(anyErr.issues)) {
        return normalizeErrors(anyErr.issues);
    }
    // Mongoose ValidationError.errors map: { description: { message, path }, ... }
    if (anyErr.errors && typeof anyErr.errors === 'object') {
        return Object.values(anyErr.errors)
            .map((e) => {
            if (e?.path)
                return combineFieldMessage(String(e.path), e.message);
            return cleanValidationMessage(e?.message || '');
        })
            .filter(Boolean);
    }
    if (typeof anyErr.message === 'string') {
        return [cleanValidationMessage(anyErr.message)];
    }
    return [];
}
/**
 * Produce a single user-friendly message for any known error type.
 * The raw/technical message is never returned for framework internals.
 */
function getUserFriendlyMessage(error) {
    const FALLBACK = 'Something went wrong. Please try again.';
    if (error == null)
        return FALLBACK;
    const err = error;
    // Mongoose validation error
    if (err.name === 'ValidationError' && err.errors) {
        const list = normalizeErrors(err);
        return list[0] || 'Some fields are invalid. Please check and try again.';
    }
    // Mongoose cast error (invalid ObjectId / wrong type)
    if (err.name === 'CastError') {
        return 'Invalid ID provided';
    }
    // Mongo duplicate key error
    if (err.code === 11000 || err.code === 11001) {
        const field = err.keyValue
            ? Object.keys(err.keyValue)[0]
            : err.keyPattern
                ? Object.keys(err.keyPattern)[0]
                : 'field';
        return `${formatFieldName(field)} already exists`;
    }
    // Zod error
    if (err.name === 'ZodError' && Array.isArray(err.issues)) {
        const list = normalizeErrors(err.issues);
        return list[0] || 'Some fields are invalid. Please check and try again.';
    }
    // JWT errors
    if (err.name === 'TokenExpiredError') {
        return 'Session expired. Please login again.';
    }
    if (err.name === 'JsonWebTokenError' || err.name === 'NotBeforeError') {
        return 'Invalid session. Please login again.';
    }
    // Multer errors
    if (err.name === 'MulterError') {
        switch (err.code) {
            case 'LIMIT_FILE_SIZE':
                return 'File is too large';
            case 'LIMIT_UNEXPECTED_FILE':
                return 'Invalid file upload field';
            case 'LIMIT_FILE_COUNT':
                return 'Too many files uploaded';
            default:
                return 'File upload failed. Please try again.';
        }
    }
    // AppError (already carries a clean user message)
    if (typeof err.userMessage === 'string' && err.userMessage) {
        return err.userMessage;
    }
    // Operational AppError without explicit userMessage
    if (err.isOperational && typeof err.message === 'string' && err.statusCode && err.statusCode < 500) {
        return err.message;
    }
    return FALLBACK;
}
