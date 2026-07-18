/**
 * Simple in-process TTL cache for Node.js
 * Eliminates redundant database queries for master collection lookups
 */
declare class InProcessCache {
    private cache;
    private defaultTTL;
    constructor(defaultTTL?: number);
    set<T>(key: string, data: T, ttl?: number): void;
    get<T>(key: string): T | null;
    delete(key: string): void;
    clear(): void;
    invalidatePattern(pattern: string): void;
    debugSnapshot(): Array<{
        key: string;
        expiresAt: number;
        remainingMs: number;
    }>;
    private cleanup;
    get size(): number;
}
export declare const cache: InProcessCache;
export declare const CacheKeys: {
    fuelType: {
        all: (filters: any) => string;
        byId: (id: string) => string;
        bySlug: (slug: string) => string;
    };
    bodyType: {
        all: (filters: any) => string;
        byId: (id: string) => string;
        bySlug: (slug: string) => string;
    };
};
export {};
