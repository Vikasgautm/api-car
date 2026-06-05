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
export declare function formatFieldName(field: string): string;
/**
 * Convert a Mongoose-style validation message into a clean sentence.
 *
 *   Path `description` is required.   -> Description is required
 *   Path `variant_name` is required.  -> Variant Name is required
 *   `description` is required         -> Description is required
 *   description is required           -> Description is required
 */
export declare function cleanValidationMessage(message: string): string;
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
export declare function normalizeErrors(errors: unknown): string[];
/**
 * Produce a single user-friendly message for any known error type.
 * The raw/technical message is never returned for framework internals.
 */
export declare function getUserFriendlyMessage(error: unknown): string;
//# sourceMappingURL=error-message.util.d.ts.map