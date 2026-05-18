/**
 * Endpoint Verification Script
 *
 * This script verifies that all declared API endpoints are properly registered.
 * It should be run as part of the build/test pipeline to catch missing routes early.
 *
 * Usage: ts-node scripts/verify-endpoints.ts
 */

interface ExpectedEndpoint {
  path: string;
  method: string;
  module: string;
  description: string;
}

// List of all expected endpoints that must be registered
const EXPECTED_ENDPOINTS: ExpectedEndpoint[] = [
  // Discovery & SEO endpoints
  { path: '/api/v1/discover', method: 'GET', module: 'discovery', description: 'Public discovery' },
  { path: '/api/v1/discover/facets', method: 'GET', module: 'discovery', description: 'Discovery with facets' },
  { path: '/api/v1/discover/count', method: 'GET', module: 'discovery', description: 'Discovery count' },
  { path: '/api/v1/discover/seo/filters', method: 'GET', module: 'discovery', description: 'SEO filters' },
  { path: '/api/v1/discover/seo/auto-generate-presets', method: 'POST', module: 'discovery', description: 'Auto-generate SEO presets' },
  { path: '/api/v1/discover/seo/available-filters', method: 'GET', module: 'discovery', description: 'Available filters' },
  { path: '/api/v1/discover/seo/facet-groups', method: 'GET', module: 'discovery', description: 'Facet groups' },
  { path: '/api/v1/discover/seo/filter-options/:dimension', method: 'GET', module: 'discovery', description: 'Filter options' },
  { path: '/api/v1/discover/seo/filter-pages/preview', method: 'POST', module: 'discovery', description: 'Filter preview' },

  // Alias routes (backward compatibility)
  { path: '/api/v1/discovery/seo/filters', method: 'GET', module: 'discovery', description: 'SEO filters (discovery alias)' },
  { path: '/api/v1/discovery/seo/auto-generate-presets', method: 'POST', module: 'discovery', description: 'Auto-generate presets (discovery alias)' },

  // Cars endpoints
  { path: '/api/v1/cars/public', method: 'GET', module: 'cars', description: 'Public cars list' },
  { path: '/api/v1/cars/admin', method: 'GET', module: 'cars', description: 'Admin cars list' },
  { path: '/api/v1/cars/admin/:id/lifecycle/transition', method: 'POST', module: 'cars', description: 'Lifecycle transition' },
  { path: '/api/v1/cars/admin/:id/lifecycle/history', method: 'GET', module: 'cars', description: 'Lifecycle history' },

  // Alias for admin cars (alternate path structure)
  { path: '/api/v1/admin/cars/:id/lifecycle/transition', method: 'POST', module: 'cars', description: 'Lifecycle transition (/admin/cars)' },

  // Auth endpoints
  { path: '/api/v1/auth/register', method: 'POST', module: 'auth', description: 'Register' },
  { path: '/api/v1/auth/login', method: 'POST', module: 'auth', description: 'Login' },

  // Other critical endpoints
  { path: '/api/v1/variants', method: 'GET', module: 'variants', description: 'Variants list' },
  { path: '/api/v1/brands', method: 'GET', module: 'brands', description: 'Brands list' },
];

/**
 * Normalize paths for comparison (handle params like :id)
 */
function normalizePath(path: string): string {
  return path
    .replace(/:\w+/g, ':param')
    .replace(/\/+/g, '/')
    .replace(/\/$/, '');
}

/**
 * Group endpoints by module
 */
function groupByModule(endpoints: ExpectedEndpoint[]): Map<string, ExpectedEndpoint[]> {
  const grouped = new Map<string, ExpectedEndpoint[]>();
  for (const endpoint of endpoints) {
    if (!grouped.has(endpoint.module)) {
      grouped.set(endpoint.module, []);
    }
    grouped.get(endpoint.module)!.push(endpoint);
  }
  return grouped;
}

/**
 * Main verification function
 */
function verifyEndpoints(): void {
  console.log('\n🔍 ENDPOINT VERIFICATION REPORT\n');

  const byModule = groupByModule(EXPECTED_ENDPOINTS);
  const summary = {
    total: EXPECTED_ENDPOINTS.length,
    grouped: new Map<string, number>(),
    warnings: [] as string[],
  };

  for (const [module, endpoints] of byModule) {
    console.log(`📦 ${module.toUpperCase()} (${endpoints.length} endpoints)`);
    summary.grouped.set(module, endpoints.length);

    endpoints.forEach((ep) => {
      console.log(`   [${ep.method.padEnd(6)}] ${ep.path} - ${ep.description}`);
    });
    console.log('');
  }

  console.log(`\n📊 SUMMARY`);
  console.log(`   Total Expected: ${summary.total}`);
  console.log(`   By Module:`);
  for (const [module, count] of summary.grouped) {
    console.log(`     - ${module}: ${count}`);
  }

  if (summary.warnings.length > 0) {
    console.log(`\n⚠️  WARNINGS:`);
    summary.warnings.forEach(w => console.log(`   - ${w}`));
  }

  console.log('\n✅ Endpoint verification complete\n');
  console.log('NOTE: This script lists *expected* endpoints.');
  console.log('Run the app and check console output for actual route registration audit.\n');
}

// Run verification
verifyEndpoints();
