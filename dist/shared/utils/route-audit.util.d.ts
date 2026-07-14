/**
 * Route Audit Utility
 *
 * Scans the Express app to identify:
 * 1. Missing routes (declared in controllers but not registered)
 * 2. Duplicate routes (same path registered multiple times)
 * 3. Unregistered modules
 *
 * Run this during development to catch route wiring issues early.
 */
import { Application, Router } from 'express';
interface RouteInfo {
    path: string;
    methods: string[];
    source: string;
}
/**
 * Extract all routes from an Express app/router recursively.
 */
export declare function extractAllRoutes(app: Application | Router, basePath?: string, source?: string, silent?: boolean): RouteInfo[];
/**
 * Audit the app for route registration issues.
 */
export declare function auditRoutes(app: Application, silent?: boolean): {
    totalRoutes: number;
    routes: RouteInfo[];
    duplicates: string[];
    warnings: string[];
};
/**
 * Log route audit results to console.
 */
export declare function logRouteAudit(audit: ReturnType<typeof auditRoutes>): void;
export {};
