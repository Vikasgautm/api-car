"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const jwt_auth_guard_1 = require("../../../modules/auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../../../modules/auth/guards/roles.guard");
const import_controller_1 = require("../controllers/import.controller");
const analytics_controller_1 = require("../controllers/analytics.controller");
const import_validation_1 = require("../validation/import.validation");
const validate_middleware_1 = require("../../../middlewares/validate.middleware");
const router = (0, express_1.Router)();
// All routes require authentication and admin role
router.use(jwt_auth_guard_1.jwtAuthGuard);
router.use(roles_guard_1.adminGuard);
// Car import routes (source auto-detected from URL domain)
router.post('/car/preview', (0, validate_middleware_1.validateBody)(import_validation_1.carPreviewSchema), import_controller_1.ImportController.previewCarImport);
router.post('/car/save', (0, validate_middleware_1.validateBody)(import_validation_1.carSaveSchema), import_controller_1.ImportController.saveCarImport);
// Variant import routes (source auto-detected from URL domain)
router.post('/variants/preview', (0, validate_middleware_1.validateBody)(import_validation_1.variantPreviewSchema), import_controller_1.ImportController.previewVariantImport);
router.post('/variants/save', (0, validate_middleware_1.validateBody)(import_validation_1.variantSaveSchema), import_controller_1.ImportController.saveVariantImport);
// Legacy cardekho aliases (kept for backwards compatibility with existing admin-car calls)
router.post('/cardekho/car/preview', (0, validate_middleware_1.validateBody)(import_validation_1.carPreviewSchema), import_controller_1.ImportController.previewCarImport);
router.post('/cardekho/car/save', (0, validate_middleware_1.validateBody)(import_validation_1.carSaveSchema), import_controller_1.ImportController.saveCarImport);
router.post('/cardekho/variants/preview', (0, validate_middleware_1.validateBody)(import_validation_1.variantPreviewSchema), import_controller_1.ImportController.previewVariantImport);
router.post('/cardekho/variants/save', (0, validate_middleware_1.validateBody)(import_validation_1.variantSaveSchema), import_controller_1.ImportController.saveVariantImport);
// Import logs
router.get('/logs', import_controller_1.ImportController.getImportLogs);
// Reprocess routes — re-run variants through the current SPEC_LABEL_MAP
// (useful when the map improves and you want old imports to benefit from new mappings)
router.post('/reprocess/variant/:variant_id', import_controller_1.ImportController.reprocessVariant);
router.post('/reprocess/car/:car_id', import_controller_1.ImportController.reprocessCar);
router.post('/reprocess/all', import_controller_1.ImportController.reprocessAll);
// Analytics routes — unmatched key frequency analysis
router.get('/analytics/unmatched-keys', analytics_controller_1.AnalyticsController.getUnmatchedKeyFrequency);
router.get('/analytics/unmatched-keys/by-source', analytics_controller_1.AnalyticsController.getFrequencyBySource);
router.get('/analytics/unmatched-keys/by-type', analytics_controller_1.AnalyticsController.getFrequencyByImportType);
// Multi-source consolidation routes
router.get('/analytics/consolidate/variant/:variant_id', analytics_controller_1.AnalyticsController.consolidateVariantFromSources);
router.get('/analytics/source-history/variant/:variant_id', analytics_controller_1.AnalyticsController.getVariantSourceHistory);
// Import confidence scoring routes
router.get('/analytics/confidence/import/:import_id', analytics_controller_1.AnalyticsController.getImportConfidenceScore);
router.get('/analytics/confidence/variant/:variant_id', analytics_controller_1.AnalyticsController.getVariantConfidenceScores);
router.get('/analytics/confidence/car/:car_id', analytics_controller_1.AnalyticsController.getCarConfidenceScores);
router.get('/analytics/quality-report', analytics_controller_1.AnalyticsController.getBatchQualityReport);
// Enum standardization routes
router.get('/analytics/standardization-report', analytics_controller_1.AnalyticsController.getStandardizationReport);
exports.default = router;
//# sourceMappingURL=import.routes.js.map