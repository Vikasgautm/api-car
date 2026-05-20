"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractAllRoutes = extractAllRoutes;
exports.auditRoutes = auditRoutes;
exports.logRouteAudit = logRouteAudit;
/**
 * Extract the mount path from an Express router middleware.
 * Express 5.x stores the mount path in middleware.path
 * Express 4.x encodes it in middleware.regexp as a regex
 */
function extractMountPath(middleware) {
    // Express 5.x: direct path property
    if (middleware.path && typeof middleware.path === 'string') {
        return middleware.path;
    }
    // Express 4.x: extract from regexp
    const regexp = middleware.regexp;
    if (typeof regexp === 'string')
        return regexp;
    if (!regexp)
        return '';
    const source = regexp.source || '';
    if (!source)
        return '';
    // Pattern examples:
    // ^\/api\/v1\/?(?=\/|$) -> extract /api/v1
    // ^\/auth\/?(?=\/|$) -> extract /auth
    // ^\/?(?=\/|$) -> extract /
    // Remove the leading ^ and everything after \/?
    // This captures the path part which uses \/ to represent /
    let path = source;
    // Remove leading ^
    if (path.startsWith('^')) {
        path = path.substring(1);
    }
    // Remove trailing \/?(?=...) or \/?... patterns
    // Find where \/ appears (the optional trailing \/)
    const optionalSlashIndex = path.indexOf('\\/?');
    if (optionalSlashIndex !== -1) {
        path = path.substring(0, optionalSlashIndex);
    }
    // Unescape \/ to /
    path = path.replace(/\\\//g, '/');
    return path;
}
/**
 * Recursively extract all routes from an Express router.
 */
function extractRoutesFromStack(stack, basePath = '', depth = 0, silent = true) {
    const routes = [];
    const indent = '  '.repeat(depth);
    if (!stack) {
        if (!silent)
            console.log(`${indent}[EXTRACT] No stack found`);
        return routes;
    }
    if (!silent)
        console.log(`${indent}[EXTRACT] Processing stack with ${stack.length} items at basePath='${basePath}'`);
    stack.forEach((middleware, i) => {
        if (middleware.route) {
            // Direct route - has a route object with methods
            const path = basePath + middleware.route.path;
            const methods = Object.keys(middleware.route.methods)
                .map(m => m.toUpperCase())
                .sort();
            if (!silent)
                console.log(`${indent}  [${i}] ROUTE: ${path} [${methods.join(',')}]`);
            routes.push({ path, methods, source: 'app' });
        }
        else if (middleware.name === 'router' && middleware.handle?.stack) {
            // Nested router - recursively extract routes from it
            // Try different ways to get the mount path (different Express versions store it differently)
            let mountPath = extractMountPath(middleware);
            const nestedBasePath = basePath + mountPath;
            if (!silent)
                console.log(`${indent}  [${i}] ROUTER: name='${middleware.name}' mountPath='${mountPath}' -> nestedBasePath='${nestedBasePath}'`);
            // Recursively extract routes from the nested router's stack
            const nestedRoutes = extractRoutesFromStack(middleware.handle.stack, nestedBasePath, depth + 1, silent);
            routes.push(...nestedRoutes);
        }
        else {
            if (!silent)
                console.log(`${indent}  [${i}] OTHER: name='${middleware.name}' route=${!!middleware.route} hasStack=${!!(middleware.handle?.stack)}`);
        }
    });
    return routes;
}
/**
 * Extract all routes from an Express app/router recursively.
 */
function extractAllRoutes(app, basePath = '', source = 'app', silent = true) {
    const appAny = app;
    if (!silent)
        console.log('[EXTRACT] Getting router from app...');
    // Express 5.x uses app.router, Express 4.x uses app._router
    let router = appAny._router || appAny.router;
    if (!router) {
        if (!silent)
            console.log('[EXTRACT] WARNING: No router found on app');
        return [];
    }
    if (!router.stack) {
        if (!silent)
            console.log('[EXTRACT] WARNING: Router has no stack');
        return [];
    }
    if (!silent)
        console.log('[EXTRACT] Router found with stack length:', router.stack.length);
    // Start recursive extraction from the app's router stack
    return extractRoutesFromStack(router.stack, basePath, 0, silent);
}
/**
 * Audit the app for route registration issues.
 */
function auditRoutes(app, silent = true) {
    if (!silent)
        console.log('[ROUTE AUDIT DEBUG] Starting route extraction...');
    const appAny = app;
    // Express 5.x uses app.router, Express 4.x uses app._router
    const router = appAny._router || appAny.router;
    if (!silent)
        console.log('[ROUTE AUDIT DEBUG] Router found:', !!router);
    if (router && router.stack && !silent) {
        console.log('[ROUTE AUDIT DEBUG] app.router.stack length:', router.stack.length);
        router.stack.forEach((middleware, i) => {
            const regexp = middleware.regexp?.source?.substring(0, 50) || (middleware.regexp ? String(middleware.regexp).substring(0, 50) : 'undefined');
            console.log(`  [${i}] name='${middleware.name}' route=${!!middleware.route} regexp='${regexp}'`);
        });
    }
    const routes = extractAllRoutes(app, '', 'app', silent);
    if (!silent)
        console.log('[ROUTE AUDIT DEBUG] Routes extracted:', routes.length);
    // Normalize paths for duplicate detection (remove trailing slashes, normalize params)
    const pathMap = new Map();
    routes.forEach(route => {
        const normalized = route.path.replace(/\/$/, '') || '/';
        const key = `${normalized}`;
        if (!pathMap.has(key)) {
            pathMap.set(key, []);
        }
        pathMap.get(key).push(route);
    });
    // Find duplicates
    const duplicates = [];
    const warnings = [];
    pathMap.forEach((routeList, path) => {
        if (routeList.length > 1) {
            duplicates.push(`${path} (registered ${routeList.length} times)`);
        }
    });
    // Check for expected high-level routes
    const expectedRootPrefixes = [
        '/api/v1/auth',
        '/api/v1/cars',
        '/api/v1/admin',
        '/api/v1/discover',
        '/api/v1/discovery',
    ];
    const registeredPaths = new Set(routes.map(r => r.path.split('/').slice(0, 4).join('/')));
    expectedRootPrefixes.forEach(prefix => {
        const hasRoute = Array.from(registeredPaths).some(p => p.startsWith(prefix));
        if (!hasRoute) {
            warnings.push(`Missing route prefix: ${prefix}`);
        }
    });
    return {
        totalRoutes: routes.length,
        routes: routes.sort((a, b) => a.path.localeCompare(b.path)),
        duplicates,
        warnings,
    };
}
/**
 * Log route audit results to console.
 */
function logRouteAudit(audit) {
    console.log('\n=== ROUTE AUDIT REPORT ===');
    console.log(`Total routes: ${audit.totalRoutes}`);
    if (audit.warnings.length > 0) {
        console.log('\n⚠️  WARNINGS:');
        audit.warnings.forEach(w => console.log(`  - ${w}`));
    }
    if (audit.duplicates.length > 0) {
        console.log('\n⚠️  DUPLICATES:');
        audit.duplicates.forEach(d => console.log(`  - ${d}`));
    }
    if (audit.warnings.length === 0 && audit.duplicates.length === 0) {
        console.log('\n✅ No route issues detected');
    }
    console.log('\n=== SAMPLE ROUTES ===');
    audit.routes.slice(0, 20).forEach(r => {
        console.log(`  [${r.methods.join(',')}] ${r.path}`);
    });
    if (audit.routes.length > 20) {
        console.log(`  ... and ${audit.routes.length - 20} more routes`);
    }
    console.log('');
}
//# sourceMappingURL=route-audit.util.js.map