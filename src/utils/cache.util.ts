/**
 * Simple in-process TTL cache for Node.js
 * Eliminates redundant database queries for master collection lookups
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class InProcessCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private defaultTTL: number; // Time to live in milliseconds

  constructor(defaultTTL: number = 5 * 60 * 1000) {
    // Default TTL: 5 minutes
    this.defaultTTL = defaultTTL;
    
    // Clean up expired entries every minute
    setInterval(() => this.cleanup(), 60 * 1000);
  }

  set<T>(key: string, data: T, ttl?: number): void {
    const expiresAt = Date.now() + (ttl || this.defaultTTL);
    this.cache.set(key, { data, expiresAt });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  debugSnapshot(): Array<{ key: string; expiresAt: number; remainingMs: number }> {
    const now = Date.now();
    return Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      expiresAt: entry.expiresAt,
      remainingMs: Math.max(0, entry.expiresAt - now),
    }));
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  get size(): number {
    return this.cache.size;
  }
}

// Export singleton instance
export const cache = new InProcessCache();

// Export cache key generators for consistent key naming
export const CacheKeys = {
  fuelType: {
    all: (filters: any) => `fueltypes:all:${JSON.stringify(filters)}`,
    byId: (id: string) => `fueltypes:id:${id}`,
    bySlug: (slug: string) => `fueltypes:slug:${slug}`,
  },
  bodyType: {
    all: (filters: any) => `bodytypes:all:${JSON.stringify(filters)}`,
    byId: (id: string) => `bodytypes:id:${id}`,
    bySlug: (slug: string) => `bodytypes:slug:${slug}`,
  },
};
