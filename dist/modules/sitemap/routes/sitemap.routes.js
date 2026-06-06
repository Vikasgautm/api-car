"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const sitemap_controller_1 = require("../controllers/sitemap.controller");
const router = (0, express_1.Router)();
// JSON listing of all sitemap URLs (admin/debug use)
router.get('/urls', sitemap_controller_1.SitemapController.getUrls);
// XML sitemap (also mounted at root /sitemap.xml via app.ts)
router.get('/', sitemap_controller_1.SitemapController.getXml);
exports.default = router;
//# sourceMappingURL=sitemap.routes.js.map