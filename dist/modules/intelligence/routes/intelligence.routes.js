"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../../middlewares/auth.middleware");
const intelligence_controller_1 = require("../controllers/intelligence.controller");
const router = (0, express_1.Router)();
// Admin-only — these change classification globally.
const adminRouter = (0, express_1.Router)();
adminRouter.use(auth_middleware_1.protect);
adminRouter.use((0, auth_middleware_1.restrictTo)('admin', 'super_admin'));
adminRouter.get('/mileage-benchmarks', intelligence_controller_1.IntelligenceController.getBenchmarkMatrix);
adminRouter.put('/mileage-benchmarks/:body_type_id/:fuel_category', intelligence_controller_1.IntelligenceController.upsertOverride);
adminRouter.delete('/mileage-benchmarks/:body_type_id/:fuel_category', intelligence_controller_1.IntelligenceController.deleteOverride);
adminRouter.post('/reclassify', intelligence_controller_1.IntelligenceController.reclassifyAll);
router.use('/admin', adminRouter);
exports.default = router;
