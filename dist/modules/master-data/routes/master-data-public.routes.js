"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const response_util_1 = require("../../../shared/utils/response.util");
const master_data_service_1 = require("../services/master-data.service");
const router = (0, express_1.Router)();
// GET /api/v1/master-data/public/labels
// Unauthenticated. Returns { category_key: { value: label } } for all active options.
// Used by public car pages to display "CVT" instead of "cvt".
router.get('/labels', async (req, res, next) => {
    try {
        const labelMap = await master_data_service_1.MasterDataService.getPublicLabelMap();
        return response_util_1.ResponseUtil.success(res, labelMap);
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
