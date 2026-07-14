/**
 * Lightweight HTML sanitizer to prevent XSS (Cross-Site Scripting) attacks
 * without the heavy memory overhead of JSDOM and DOMPurify on the server.
 */
export declare function sanitizeHtml(html: string): string;
