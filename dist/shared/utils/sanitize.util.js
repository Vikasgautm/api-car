"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeHtml = sanitizeHtml;
/**
 * Lightweight HTML sanitizer to prevent XSS (Cross-Site Scripting) attacks
 * without the heavy memory overhead of JSDOM and DOMPurify on the server.
 */
function sanitizeHtml(html) {
    if (!html || typeof html !== 'string')
        return html || '';
    // 1. Strip script tags and their inner content
    let cleaned = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    // 2. Strip inline event handlers (e.g., onclick, onerror, onload, onmouseover, etc.)
    cleaned = cleaned.replace(/\s*on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '');
    // 3. Strip javascript: and vbscript: URIs in href, src, etc.
    cleaned = cleaned.replace(/(href|src|action)\s*=\s*(?:"\s*(javascript|vbscript):[^"]*"|'\s*(javascript|vbscript):[^']*'|(?:"|')?\s*(javascript|vbscript):[^\s>]+)/gi, '$1="#"');
    // 4. Strip iframe if they contain javascript URLs
    cleaned = cleaned.replace(/<iframe\b[^>]*src\s*=\s*(?:"\s*javascript:[^"]*"|'\s*javascript:[^']*'|javascript:[^\s>]+)[^>]*>.*?<\/iframe>/gi, '');
    return cleaned;
}
