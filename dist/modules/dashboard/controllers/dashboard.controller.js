"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardController = void 0;
const dashboard_activity_service_1 = require("../services/dashboard-activity.service");
const dashboard_comparison_service_1 = require("../services/dashboard-comparison.service");
const dashboard_fuel_service_1 = require("../services/dashboard-fuel.service");
const dashboard_health_service_1 = require("../services/dashboard-health.service");
const dashboard_import_service_1 = require("../services/dashboard-import.service");
const dashboard_overview_service_1 = require("../services/dashboard-overview.service");
const dashboard_priority_service_1 = require("../services/dashboard-priority.service");
const dashboard_search_service_1 = require("../services/dashboard-search.service");
const dashboard_seo_service_1 = require("../services/dashboard-seo.service");
class DashboardController {
    static async getOverview(req, res) {
        try {
            const data = await dashboard_overview_service_1.DashboardOverviewService.getOverview();
            res.json({ success: true, data });
        }
        catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }
    static async getPriorities(req, res) {
        try {
            const data = await dashboard_priority_service_1.DashboardPriorityService.getPriorities();
            res.json({ success: true, data });
        }
        catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }
    static async getContentHealth(req, res) {
        try {
            const data = await dashboard_health_service_1.DashboardHealthService.getSummary();
            res.json({ success: true, data });
        }
        catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }
    static async getRecentActivity(req, res) {
        try {
            const limit = Math.min(Number(req.query.limit) || 20, 50);
            const data = await dashboard_activity_service_1.DashboardActivityService.getRecentActivity(limit);
            res.json({ success: true, data });
        }
        catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }
    static async getSeoSummary(req, res) {
        try {
            const data = await dashboard_seo_service_1.DashboardSeoService.getSummary();
            res.json({ success: true, data });
        }
        catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }
    static async getImportHealth(req, res) {
        try {
            const data = await dashboard_import_service_1.DashboardImportService.getSummary();
            res.json({ success: true, data });
        }
        catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }
    static async getFuelSummary(req, res) {
        try {
            const data = await dashboard_fuel_service_1.DashboardFuelService.getSnapshot();
            res.json({ success: true, data });
        }
        catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }
    static async getComparisonSummary(req, res) {
        try {
            const data = await dashboard_comparison_service_1.DashboardComparisonService.getSummary();
            res.json({ success: true, data });
        }
        catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }
    static async globalSearch(req, res) {
        try {
            const q = String(req.query.q || '').trim();
            const data = await dashboard_search_service_1.DashboardSearchService.search(q);
            res.json({ success: true, data });
        }
        catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }
}
exports.DashboardController = DashboardController;
