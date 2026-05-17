import { Router } from 'express';
import { DiscoveryController } from '../controllers/discovery.controller';

const router = Router();

// Public discovery endpoints.
router.get('/', DiscoveryController.discover);
router.get('/facets', DiscoveryController.discoverWithFacets);
router.get('/count', DiscoveryController.count);

// SEO filter generation endpoints (admin)
router.get('/seo/filters', DiscoveryController.seoFilters);
router.post('/seo/auto-generate-presets', DiscoveryController.autoGeneratePresetsFromFilters);

export default router;
