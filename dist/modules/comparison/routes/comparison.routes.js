"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const comparison_controller_1 = require("../controllers/comparison.controller");
const auth_middleware_1 = require("../../../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Public specific routes (must come before generic /:id routes)
router.get('/popular', (req, res, next) => comparison_controller_1.ComparisonController.getPopularComparisons(req, res, next));
router.get('/trending', (req, res, next) => comparison_controller_1.ComparisonController.getTrendingComparisons(req, res, next));
router.get('/category/:category', (req, res, next) => comparison_controller_1.ComparisonController.getComparisonsByCategory(req, res, next));
router.get('/slug/:slug', (req, res, next) => comparison_controller_1.ComparisonController.getComparisonBySlug(req, res, next));
// Rival management specific routes (must come before generic /:id routes)
router.post('/rivals/add', auth_middleware_1.protect, (0, auth_middleware_1.restrictTo)('admin', 'super_admin'), (req, res, next) => comparison_controller_1.ComparisonController.addRival(req, res, next));
router.delete('/rivals/:car_id/:rival_id', auth_middleware_1.protect, (0, auth_middleware_1.restrictTo)('admin', 'super_admin'), (req, res, next) => comparison_controller_1.ComparisonController.removeRival(req, res, next));
router.get('/rivals/:car_id', (req, res, next) => comparison_controller_1.ComparisonController.getRivals(req, res, next));
// Admin routes (require authentication and admin role)
router.post('/', auth_middleware_1.protect, (0, auth_middleware_1.restrictTo)('admin', 'super_admin'), (req, res, next) => comparison_controller_1.ComparisonController.createComparison(req, res, next));
router.get('/', auth_middleware_1.protect, (0, auth_middleware_1.restrictTo)('admin', 'super_admin'), (req, res, next) => comparison_controller_1.ComparisonController.getComparisons(req, res, next));
// Generic routes with ID (must come last)
router.put('/:id', auth_middleware_1.protect, (0, auth_middleware_1.restrictTo)('admin', 'super_admin'), (req, res, next) => comparison_controller_1.ComparisonController.updateComparison(req, res, next));
router.patch('/:id/restore', auth_middleware_1.protect, (0, auth_middleware_1.restrictTo)('admin', 'super_admin'), (req, res, next) => comparison_controller_1.ComparisonController.restoreComparison(req, res, next));
router.delete('/:id', auth_middleware_1.protect, (0, auth_middleware_1.restrictTo)('admin', 'super_admin'), (req, res, next) => comparison_controller_1.ComparisonController.deleteComparison(req, res, next));
router.get('/:id', (req, res, next) => comparison_controller_1.ComparisonController.getComparisonById(req, res, next));
exports.default = router;
//# sourceMappingURL=comparison.routes.js.map