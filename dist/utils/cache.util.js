"use strict";
/**
 * Simple in-process TTL cache for Node.js
 * Eliminates redundant database queries for master collection lookups
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheKeys = exports.cache = void 0;
class InProcessCache {
    cache = new Map();
    defaultTTL; // Time to live in milliseconds
    constructor(defaultTTL = 5 * 60 * 1000) {
        // Default TTL: 5 minutes
        this.defaultTTL = defaultTTL;
        // Clean up expired entries every minute
        setInterval(() => this.cleanup(), 60 * 1000);
    }
    set(key, data, ttl) {
        const expiresAt = Date.now() + (ttl || this.defaultTTL);
        this.cache.set(key, { data, expiresAt });
    }
    get(key) {
        const entry = this.cache.get(key);
        if (!entry)
            return null;
        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return null;
        }
        return entry.data;
    }
    delete(key) {
        this.cache.delete(key);
    }
    clear() {
        this.cache.clear();
    }
    invalidatePattern(pattern) {
        const regex = new RegExp(pattern);
        for (const key of this.cache.keys()) {
            if (regex.test(key)) {
                this.cache.delete(key);
            }
        }
    }
    cleanup() {
        const now = Date.now();
        for (const [key, entry] of this.cache.entries()) {
            if (now > entry.expiresAt) {
                this.cache.delete(key);
            }
        }
    }
    get size() {
        return this.cache.size;
    }
}
// Export singleton instance
exports.cache = new InProcessCache();
// Export cache key generators for consistent key naming
exports.CacheKeys = {
    fuelType: {
        all: (filters) => `fueltypes:all:${JSON.stringify(filters)}`,
        byId: (id) => `fueltypes:id:${id}`,
        bySlug: (slug) => `fueltypes:slug:${slug}`,
    },
    bodyType: {
        all: (filters) => `bodytypes:all:${JSON.stringify(filters)}`,
        byId: (id) => `bodytypes:id:${id}`,
        bySlug: (slug) => `bodytypes:slug:${slug}`,
    },
};
