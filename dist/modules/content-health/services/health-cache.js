"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheGet = cacheGet;
exports.cacheSet = cacheSet;
exports.cacheInvalidate = cacheInvalidate;
exports.cacheSize = cacheSize;
const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes
const store = new Map();
function cacheGet(key) {
    const entry = store.get(key);
    if (!entry || Date.now() > entry.expiresAt) {
        store.delete(key);
        return null;
    }
    return entry.data;
}
function cacheSet(key, data, ttlMs = DEFAULT_TTL_MS) {
    store.set(key, { data, expiresAt: Date.now() + ttlMs });
}
function cacheInvalidate(pattern) {
    if (!pattern) {
        store.clear();
        return;
    }
    for (const key of store.keys()) {
        if (key.includes(pattern))
            store.delete(key);
    }
}
function cacheSize() {
    return store.size;
}
//# sourceMappingURL=health-cache.js.map