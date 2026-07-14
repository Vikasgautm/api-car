"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GovernanceController = void 0;
const uuid_1 = require("uuid");
const user_model_1 = require("../../../models/user.model");
const app_error_util_1 = require("../../../shared/utils/app-error.util");
const response_util_1 = require("../../../shared/utils/response.util");
const catchAsync_1 = require("../../../utils/catchAsync");
const edit_lock_service_1 = require("../services/edit-lock.service");
const ownership_service_1 = require("../services/ownership.service");
const permission_service_1 = require("../services/permission.service");
const user_activity_service_1 = require("../services/user-activity.service");
const workflow_service_1 = require("../services/workflow.service");
const str = (v) => Array.isArray(v) ? v[0] : v;
const buildPagination = (page, limit, total) => ({
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    hasNext: page * limit < total,
    hasPrev: page > 1,
});
class GovernanceController {
    // ─── USERS ───────────────────────────────────────────────────────────
    static getGovernanceUsers = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const page = Number(req.query.page || 1);
        const limit = Number(req.query.limit || 20);
        const search = str(req.query.search);
        const role = str(req.query.role);
        const governance_role = str(req.query.governance_role);
        const domain = str(req.query.domain);
        const brand = str(req.query.brand);
        const status = str(req.query.status);
        const query = { is_deleted: false };
        if (search) {
            query.$or = [
                { user_name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
            ];
        }
        if (role)
            query.role = role;
        if (governance_role)
            query.governance_role = governance_role;
        if (domain)
            query.assigned_domains = domain;
        if (brand)
            query.assigned_brands = brand;
        if (status === 'active')
            query.is_active = true;
        if (status === 'inactive')
            query.is_active = false;
        const skip = (page - 1) * limit;
        const [users, total] = await Promise.all([
            user_model_1.User.find(query)
                .select('-password -password_reset_token -password_reset_expires')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            user_model_1.User.countDocuments(query),
        ]);
        return response_util_1.ResponseUtil.paginated(res, users, buildPagination(page, limit, total), 'Users retrieved');
    });
    static getGovernanceUserById = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const user = await user_model_1.User.findOne({ user_id: req.params.id, is_deleted: false })
            .select('-password -password_reset_token -password_reset_expires');
        if (!user)
            throw new app_error_util_1.AppError('User not found', 404);
        return response_util_1.ResponseUtil.success(res, user, 'User retrieved');
    });
    static createGovernanceUser = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const { user_name, email, password, phone, role, governance_role, permissions, assigned_brands, assigned_domains, workflow_rights, security, } = req.body;
        if (!email || !user_name)
            throw new app_error_util_1.AppError('Name and email are required', 400);
        const existing = await user_model_1.User.findOne({ email, is_deleted: false });
        if (existing)
            throw new app_error_util_1.AppError('User with this email already exists', 400);
        const userData = {
            user_id: (0, uuid_1.v4)(),
            user_name,
            email,
            phone,
            role: role || 'editor',
            governance_role,
            permissions: permissions || [],
            assigned_brands: assigned_brands || [],
            assigned_domains: assigned_domains || [],
            workflow_rights: workflow_rights || { can_review: false, can_publish: false, can_bulk_publish: false },
            security: security || { max_sessions: 3, force_password_reset: false },
            is_email_verified: false,
            is_active: true,
        };
        if (password)
            userData.password = password;
        const user = await user_model_1.User.create(userData);
        const { password: _p, ...safeUser } = user.toObject();
        return response_util_1.ResponseUtil.success(res, safeUser, 'User created successfully', 201);
    });
    static updateGovernanceUser = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const { user_name, phone, role, governance_role, permissions, assigned_brands, assigned_domains, workflow_rights, security, is_active, } = req.body;
        const allowedUpdates = {};
        if (user_name !== undefined)
            allowedUpdates.user_name = user_name;
        if (phone !== undefined)
            allowedUpdates.phone = phone;
        if (role !== undefined)
            allowedUpdates.role = role;
        if (governance_role !== undefined)
            allowedUpdates.governance_role = governance_role;
        if (permissions !== undefined)
            allowedUpdates.permissions = permissions;
        if (assigned_brands !== undefined)
            allowedUpdates.assigned_brands = assigned_brands;
        if (assigned_domains !== undefined)
            allowedUpdates.assigned_domains = assigned_domains;
        if (workflow_rights !== undefined)
            allowedUpdates.workflow_rights = workflow_rights;
        if (security !== undefined)
            allowedUpdates.security = security;
        if (is_active !== undefined)
            allowedUpdates.is_active = is_active;
        const user = await user_model_1.User.findOneAndUpdate({ user_id: req.params.id, is_deleted: false }, allowedUpdates, { new: true }).select('-password -password_reset_token -password_reset_expires');
        if (!user)
            throw new app_error_util_1.AppError('User not found', 404);
        return response_util_1.ResponseUtil.success(res, user, 'User updated');
    });
    static suspendUser = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const user = await user_model_1.User.findOneAndUpdate({ user_id: req.params.id, is_deleted: false }, { is_active: false }, { new: true }).select('-password');
        if (!user)
            throw new app_error_util_1.AppError('User not found', 404);
        return response_util_1.ResponseUtil.success(res, user, 'User suspended');
    });
    static activateUser = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const user = await user_model_1.User.findOneAndUpdate({ user_id: req.params.id, is_deleted: false }, { is_active: true }, { new: true }).select('-password');
        if (!user)
            throw new app_error_util_1.AppError('User not found', 404);
        return response_util_1.ResponseUtil.success(res, user, 'User activated');
    });
    // ─── PERMISSIONS ─────────────────────────────────────────────────────────
    static getUserPermissions = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const permissions = await permission_service_1.PermissionService.getUserPermissions(String(req.params.id));
        return response_util_1.ResponseUtil.success(res, { permissions }, 'Permissions retrieved');
    });
    static checkPermission = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const user_id = str(req.query.user_id) || '';
        const permission = str(req.query.permission) || '';
        const allowed = await permission_service_1.PermissionService.checkPermission(user_id, permission);
        return response_util_1.ResponseUtil.success(res, { allowed, user_id, permission }, 'Permission checked');
    });
    // ─── OWNERSHIP ───────────────────────────────────────────────────────────
    static getOwnershipGrid = (0, catchAsync_1.catchAsync)(async (_req, res) => {
        const grid = await ownership_service_1.OwnershipService.getOwnershipGrid();
        return response_util_1.ResponseUtil.success(res, grid, 'Ownership grid retrieved');
    });
    static getUnassignedBrands = (0, catchAsync_1.catchAsync)(async (_req, res) => {
        const brands = await ownership_service_1.OwnershipService.getUnassignedBrands();
        return response_util_1.ResponseUtil.success(res, brands, 'Unassigned brands retrieved');
    });
    static getWorkloadSummaries = (0, catchAsync_1.catchAsync)(async (_req, res) => {
        const summaries = await ownership_service_1.OwnershipService.getWorkloadSummaries();
        return response_util_1.ResponseUtil.success(res, summaries, 'Workload summaries retrieved');
    });
    static assignBrand = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const { user_id, brand_id } = req.body;
        if (!user_id || !brand_id)
            throw new app_error_util_1.AppError('user_id and brand_id are required', 400);
        await ownership_service_1.OwnershipService.assignBrand(user_id, brand_id);
        return response_util_1.ResponseUtil.success(res, { user_id, brand_id }, 'Brand assigned');
    });
    static unassignBrand = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const { user_id, brand_id } = req.body;
        if (!user_id || !brand_id)
            throw new app_error_util_1.AppError('user_id and brand_id are required', 400);
        await ownership_service_1.OwnershipService.unassignBrand(user_id, brand_id);
        return response_util_1.ResponseUtil.success(res, { user_id, brand_id }, 'Brand unassigned');
    });
    // ─── WORKFLOW ────────────────────────────────────────────────────────────
    static getWorkflowQueue = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const page = Number(str(req.query.page) || 1);
        const limit = Number(str(req.query.limit) || 20);
        const status = str(req.query.status);
        const entity_type = str(req.query.entity_type);
        const submitted_by = str(req.query.submitted_by);
        const brand_id = str(req.query.brand_id);
        const result = await workflow_service_1.WorkflowService.getQueue({ status, entity_type, submitted_by, brand_id, page, limit });
        return response_util_1.ResponseUtil.paginated(res, result.items, buildPagination(result.page, result.limit, result.total), 'Workflow queue retrieved');
    });
    static getWorkflowStats = (0, catchAsync_1.catchAsync)(async (_req, res) => {
        const stats = await workflow_service_1.WorkflowService.getWorkflowStats();
        return response_util_1.ResponseUtil.success(res, stats, 'Workflow stats retrieved');
    });
    static submitForReview = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const user = req.user;
        const item = await workflow_service_1.WorkflowService.submitForReview({
            ...req.body,
            submitted_by: String(user?.user_id || user?.id || ''),
            submitted_by_name: String(user?.username || user?.user_id || ''),
        });
        return response_util_1.ResponseUtil.success(res, item, 'Submitted for review', 201);
    });
    static approveWorkflow = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const user = req.user;
        const userId = String(user?.user_id || user?.id || '');
        const item = await workflow_service_1.WorkflowService.approve(String(req.params.id), userId, req.body.note);
        return response_util_1.ResponseUtil.success(res, item, 'Item approved');
    });
    static rejectWorkflow = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const user = req.user;
        const userId = String(user?.user_id || user?.id || '');
        const item = await workflow_service_1.WorkflowService.reject(String(req.params.id), userId, req.body.reason);
        return response_util_1.ResponseUtil.success(res, item, 'Item rejected');
    });
    static publishWorkflow = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const user = req.user;
        const userId = String(user?.user_id || user?.id || '');
        const item = await workflow_service_1.WorkflowService.publish(String(req.params.id), userId);
        return response_util_1.ResponseUtil.success(res, item, 'Item published');
    });
    // ─── ACTIVITY ────────────────────────────────────────────────────────────
    static getUserActivity = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const page = Number(str(req.query.page) || 1);
        const limit = Number(str(req.query.limit) || 30);
        const entity_type = str(req.query.entity_type);
        const action = str(req.query.action);
        const date_from = str(req.query.date_from);
        const date_to = str(req.query.date_to);
        const result = await user_activity_service_1.UserActivityService.getUserActivity(String(req.params.id), { page, limit, entity_type, action, date_from, date_to });
        return response_util_1.ResponseUtil.paginated(res, result.logs, buildPagination(result.page, result.limit, result.total), 'Activity retrieved');
    });
    static getUserActivitySummary = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const summary = await user_activity_service_1.UserActivityService.getUserActivitySummary(String(req.params.id));
        return response_util_1.ResponseUtil.success(res, summary, 'Activity summary retrieved');
    });
    static getAllActivity = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const page = Number(str(req.query.page) || 1);
        const limit = Number(str(req.query.limit) || 30);
        const user_id = str(req.query.user_id);
        const entity_type = str(req.query.entity_type);
        const action = str(req.query.action);
        const date_from = str(req.query.date_from);
        const date_to = str(req.query.date_to);
        const result = await user_activity_service_1.UserActivityService.getAllActivity({ page, limit, user_id, entity_type, action, date_from, date_to });
        return response_util_1.ResponseUtil.paginated(res, result.logs, buildPagination(result.page, result.limit, result.total), 'Activity retrieved');
    });
    static getCrossUserSummary = (0, catchAsync_1.catchAsync)(async (_req, res) => {
        const summary = await user_activity_service_1.UserActivityService.getCrossUserActivitySummary();
        return response_util_1.ResponseUtil.success(res, summary, 'Cross-user summary retrieved');
    });
    // ─── EDIT LOCKS ──────────────────────────────────────────────────────────
    static acquireLock = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const user = req.user;
        const { entity_type, entity_id } = req.body;
        if (!entity_type || !entity_id)
            throw new app_error_util_1.AppError('entity_type and entity_id are required', 400);
        const lock = await edit_lock_service_1.EditLockService.acquireLock(String(entity_type), String(entity_id), String(user?.user_id || user?.id || ''), String(user?.user_id || ''), String(user?.email || ''));
        return response_util_1.ResponseUtil.success(res, lock, 'Lock acquired');
    });
    static checkLock = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const entity_type = str(req.query.entity_type) || '';
        const entity_id = str(req.query.entity_id) || '';
        const info = await edit_lock_service_1.EditLockService.checkLock(entity_type, entity_id);
        return response_util_1.ResponseUtil.success(res, info, 'Lock status retrieved');
    });
    static releaseLock = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const user = req.user;
        const { entity_type, entity_id } = req.body;
        await edit_lock_service_1.EditLockService.releaseLock(String(entity_type), String(entity_id), String(user?.user_id || user?.id || ''));
        return response_util_1.ResponseUtil.success(res, null, 'Lock released');
    });
    static forceReleaseLock = (0, catchAsync_1.catchAsync)(async (req, res) => {
        const { entity_type, entity_id } = req.body;
        await edit_lock_service_1.EditLockService.forceRelease(entity_type, entity_id);
        return response_util_1.ResponseUtil.success(res, null, 'Lock force-released');
    });
}
exports.GovernanceController = GovernanceController;
