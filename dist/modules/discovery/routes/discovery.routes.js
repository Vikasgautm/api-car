"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const discovery_controller_1 = require("../controllers/discovery.controller");
const router = (0, express_1.Router)();
// Public discovery endpoints.
router.get('/', discovery_controller_1.DiscoveryController.discover);
router.get('/facets', discovery_controller_1.DiscoveryController.discoverWithFacets);
router.get('/count', discovery_controller_1.DiscoveryController.count);
exports.default = router;
//# sourceMappingURL=discovery.routes.js.map