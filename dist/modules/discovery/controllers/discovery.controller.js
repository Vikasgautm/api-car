"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiscoveryController = void 0;
const response_util_1 = require("../../../shared/utils/response.util");
const catchAsync_1 = require("../../../utils/catchAsync");
const discovery_service_1 = require("../services/discovery.service");
class DiscoveryController {
    static discover = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const result = await discovery_service_1.DiscoveryService.discover(req.query);
        return response_util_1.ResponseUtil.paginated(res, result.cars, result.pagination, 'Discovery results retrieved');
    });
    /**
     * Same shape as `discover` but also surfaces the facets payload — useful for
     * the discovery sidebar. Kept separate so the public list endpoint can avoid
     * paying the facet cost if it doesn't need it.
     */
    static discoverWithFacets = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const result = await discovery_service_1.DiscoveryService.discover(req.query);
        return response_util_1.ResponseUtil.success(res, {
            data: result.cars,
            pagination: result.pagination,
            facets: result.facets,
            applied: result.applied,
        }, 'Discovery results with facets');
    });
    /** Pure count, used by SEO preset preview. */
    static count = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const count = await discovery_service_1.DiscoveryService.count(req.query);
        return response_util_1.ResponseUtil.success(res, { count }, 'Match count retrieved');
    });
}
exports.DiscoveryController = DiscoveryController;
//# sourceMappingURL=discovery.controller.js.map