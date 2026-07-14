"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportStagingController = void 0;
const response_util_1 = require("../../../shared/utils/response.util");
const catchAsync_1 = require("../../../utils/catchAsync");
const VariantIngestionService_1 = require("../services/VariantIngestionService");
const VariantPushService_1 = require("../services/VariantPushService");
class ImportStagingController {
    // POST /admin/imports/preview
    static previewStaging = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const { variants } = req.body;
        if (!Array.isArray(variants) || variants.length === 0) {
            return response_util_1.ResponseUtil.badRequest(res, 'variants array is required');
        }
        const preview = await VariantIngestionService_1.VariantIngestionService.previewStaging(variants);
        return response_util_1.ResponseUtil.success(res, preview, 'Preview generated');
    });
    // POST /admin/imports/stage
    static createSession = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const { session_name, source_name, variants } = req.body;
        const userId = req.user?.user_id || 'admin';
        if (!session_name || !Array.isArray(variants) || variants.length === 0) {
            return response_util_1.ResponseUtil.badRequest(res, 'session_name and variants are required');
        }
        const result = await VariantIngestionService_1.VariantIngestionService.createSession({
            session_name,
            source_name,
            imported_by: userId,
            variants,
        });
        return response_util_1.ResponseUtil.created(res, result, 'Import session created and variants staged');
    });
    // GET /admin/imports/sessions
    static getSessions = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const page = parseInt(String(req.query.page || 1));
        const limit = parseInt(String(req.query.limit || 20));
        const result = await VariantIngestionService_1.VariantIngestionService.getSessions(page, limit);
        return response_util_1.ResponseUtil.success(res, result, 'Sessions retrieved');
    });
    // GET /admin/imports/sessions/:id
    static getSession = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const session = await VariantIngestionService_1.VariantIngestionService.getSession(id);
        if (!session)
            return response_util_1.ResponseUtil.notFound(res, 'Session not found');
        return response_util_1.ResponseUtil.success(res, session, 'Session retrieved');
    });
    // GET /admin/imports
    static getStagingList = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const { page = 1, limit = 50, ...filters } = req.query;
        const result = await VariantIngestionService_1.VariantIngestionService.getStagingList(filters, parseInt(String(page)), parseInt(String(limit)));
        return response_util_1.ResponseUtil.success(res, result, 'Staging variants retrieved');
    });
    // GET /admin/imports/:id
    static getStagingVariant = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const { VariantImportStaging } = await Promise.resolve().then(() => __importStar(require('../models/VariantImportStaging')));
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const doc = await VariantImportStaging.findById(id);
        if (!doc)
            return response_util_1.ResponseUtil.notFound(res, 'Staging variant not found');
        return response_util_1.ResponseUtil.success(res, doc, 'Staging variant retrieved');
    });
    // PATCH /admin/imports/:id/link-car
    static linkCar = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const { car_id } = req.body;
        const userId = req.user?.user_id || 'admin';
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        if (!car_id)
            return response_util_1.ResponseUtil.badRequest(res, 'car_id is required');
        const result = await VariantIngestionService_1.VariantIngestionService.linkCar(id, car_id, userId);
        return response_util_1.ResponseUtil.success(res, result, 'Car linked successfully');
    });
    // PATCH /admin/imports/bulk-link
    static bulkLinkCar = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const { staging_ids, car_id } = req.body;
        const userId = req.user?.user_id || 'admin';
        if (!Array.isArray(staging_ids) || !car_id) {
            return response_util_1.ResponseUtil.badRequest(res, 'staging_ids array and car_id are required');
        }
        const result = await VariantIngestionService_1.VariantIngestionService.bulkLinkCar(staging_ids, car_id, userId);
        return response_util_1.ResponseUtil.success(res, result, 'Bulk car link applied');
    });
    // PATCH /admin/imports/bulk-validate
    static bulkValidate = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const { staging_ids } = req.body;
        if (!Array.isArray(staging_ids) || staging_ids.length === 0) {
            return response_util_1.ResponseUtil.badRequest(res, 'staging_ids array is required');
        }
        const results = await VariantIngestionService_1.VariantIngestionService.bulkValidate(staging_ids);
        return response_util_1.ResponseUtil.success(res, results, 'Validation complete');
    });
    // PATCH /admin/imports/bulk-review
    static bulkReview = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const { staging_ids } = req.body;
        const userId = req.user?.user_id || 'admin';
        if (!Array.isArray(staging_ids) || staging_ids.length === 0) {
            return response_util_1.ResponseUtil.badRequest(res, 'staging_ids array is required');
        }
        const result = await VariantIngestionService_1.VariantIngestionService.bulkUpdateStatus(staging_ids, 'reviewed', userId);
        return response_util_1.ResponseUtil.success(res, result, 'Marked as reviewed');
    });
    // PATCH /admin/imports/bulk-ready
    static bulkMarkReady = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const { staging_ids } = req.body;
        const userId = req.user?.user_id || 'admin';
        if (!Array.isArray(staging_ids) || staging_ids.length === 0) {
            return response_util_1.ResponseUtil.badRequest(res, 'staging_ids array is required');
        }
        const result = await VariantIngestionService_1.VariantIngestionService.bulkUpdateStatus(staging_ids, 'ready_to_push', userId);
        return response_util_1.ResponseUtil.success(res, result, 'Marked as ready to push');
    });
    // POST /admin/imports/bulk-push
    static bulkPush = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const { staging_ids } = req.body;
        const userId = req.user?.user_id || 'admin';
        if (!Array.isArray(staging_ids) || staging_ids.length === 0) {
            return response_util_1.ResponseUtil.badRequest(res, 'staging_ids array is required');
        }
        const results = await VariantPushService_1.VariantPushService.pushBulk(staging_ids, userId);
        const pushed = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;
        return response_util_1.ResponseUtil.success(res, { results, pushed, failed }, `Pushed ${pushed} variants, ${failed} failed`);
    });
    // PATCH /admin/imports/:id/reject
    static rejectVariant = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const { reason } = req.body;
        const userId = req.user?.user_id || 'admin';
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const result = await VariantIngestionService_1.VariantIngestionService.rejectVariant(id, reason || '', userId);
        return response_util_1.ResponseUtil.success(res, result, 'Variant rejected');
    });
    // GET /admin/imports/:id/diff
    static getDiff = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const diffs = await VariantPushService_1.VariantPushService.getDiff(id);
        return response_util_1.ResponseUtil.success(res, diffs, 'Diff retrieved');
    });
    // POST /admin/imports/check-duplicates
    static checkDuplicates = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const { variants } = req.body;
        if (!Array.isArray(variants) || variants.length === 0) {
            return response_util_1.ResponseUtil.badRequest(res, 'variants array is required');
        }
        const result = await VariantIngestionService_1.VariantIngestionService.checkDuplicates(variants);
        return response_util_1.ResponseUtil.success(res, result, 'Duplicate check complete');
    });
}
exports.ImportStagingController = ImportStagingController;
