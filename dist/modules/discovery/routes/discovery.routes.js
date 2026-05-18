"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const discovery_controller_1 = require("../controllers/discovery.controller");
const router = (0, express_1.Router)();
// Public discovery endpoints.
router.get('/', discovery_controller_1.DiscoveryController.discover);
router.get('/facets', discovery_controller_1.DiscoveryController.discoverWithFacets);
router.get('/count', discovery_controller_1.DiscoveryController.count);
// SEO filter generation endpoints (admin)
router.get('/seo/filters', discovery_controller_1.DiscoveryController.seoFilters);
router.post('/seo/auto-generate-presets', discovery_controller_1.DiscoveryController.autoGeneratePresetsFromFilters);
// SEO filter and discovery endpoints
router.get('/seo/available-filters', discovery_controller_1.DiscoveryController.getAvailableFilters);
router.get('/seo/facet-groups', discovery_controller_1.DiscoveryController.getFacetGroups);
router.get('/seo/filter-options/:dimension', discovery_controller_1.DiscoveryController.getFilterOptions);
router.post('/seo/filter-pages/preview', discovery_controller_1.DiscoveryController.previewFilterPage);
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
exports.default = router;
//# sourceMappingURL=discovery.routes.js.map