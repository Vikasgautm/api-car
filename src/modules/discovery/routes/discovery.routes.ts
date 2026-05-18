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

// SEO filter and discovery endpoints
router.get('/seo/available-filters', DiscoveryController.getAvailableFilters);
router.get('/seo/facet-groups', DiscoveryController.getFacetGroups);
router.get('/seo/filter-options/:dimension', DiscoveryController.getFilterOptions);
router.post('/seo/filter-pages/preview', DiscoveryController.previewFilterPage);

// Filter page CRUD endpoints (stub implementations for now)
router.get('/seo/filter-pages', (req, res) => {
  res.json({ data: [], pagination: { page: 1, limit: 20, total: 0 } });
});
router.post('/seo/filter-pages', (req, res) => {
  res.status(201).json({ id: 'new-filter-page', ...req.body });
});
router.patch('/seo/filter-pages/:pageId', (req, res) => {
  res.json({ id: req.params.pageId, ...req.body });
});
router.delete('/seo/filter-pages/:pageId', (req, res) => {
  res.json({ success: true });
});
router.post('/seo/filter-pages/bulk-generate', (req, res) => {
  res.json({ created: 0 });
});
router.post('/seo/filter-pages/refresh-all', (req, res) => {
  res.json({ updated: 0 });
});

export default router;
