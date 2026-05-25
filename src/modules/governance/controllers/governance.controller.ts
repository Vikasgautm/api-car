import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../../../models/user.model';
import { AppError } from '../../../shared/utils/app-error.util';
import { ResponseUtil } from '../../../shared/utils/response.util';
import { AuthRequest } from '../../../types/auth';
import { catchAsync } from '../../../utils/catchAsync';
import { EditLockService } from '../services/edit-lock.service';
import { OwnershipService } from '../services/ownership.service';
import { PermissionService } from '../services/permission.service';
import { UserActivityService } from '../services/user-activity.service';
import { WorkflowService } from '../services/workflow.service';

const str = (v: string | string[] | undefined): string | undefined =>
  Array.isArray(v) ? v[0] : v;

const buildPagination = (page: number, limit: number, total: number) => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit),
  hasNext: page * limit < total,
  hasPrev: page > 1,
});

export class GovernanceController {
  // ─── USERS ───────────────────────────────────────────────────────────
  static getGovernanceUsers = catchAsync(async (req: Request, res: Response) => {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const search = str(req.query.search as any);
    const role = str(req.query.role as any);
    const governance_role = str(req.query.governance_role as any);
    const domain = str(req.query.domain as any);
    const brand = str(req.query.brand as any);
    const status = str(req.query.status as any);

    const query: Record<string, any> = { is_deleted: false };

    if (search) {
      query.$or = [
        { user_name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    if (role) query.role = role;
    if (governance_role) query.governance_role = governance_role;
    if (domain) query.assigned_domains = domain;
    if (brand) query.assigned_brands = brand;
    if (status === 'active') query.is_active = true;
    if (status === 'inactive') query.is_active = false;

    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password -password_reset_token -password_reset_expires')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(query),
    ]);

    return ResponseUtil.paginated(res, users, buildPagination(page, limit, total), 'Users retrieved');
  });

  static getGovernanceUserById = catchAsync(async (req: Request, res: Response) => {
    const user = await User.findOne({ user_id: req.params.id, is_deleted: false })
      .select('-password -password_reset_token -password_reset_expires');
    if (!user) throw new AppError('User not found', 404);
    return ResponseUtil.success(res, user, 'User retrieved');
  });

  static createGovernanceUser = catchAsync(async (req: Request, res: Response) => {
    const {
      user_name, email, password, phone, role, governance_role,
      permissions, assigned_brands, assigned_domains, workflow_rights, security,
    } = req.body;

    if (!email || !user_name) throw new AppError('Name and email are required', 400);

    const existing = await User.findOne({ email, is_deleted: false });
    if (existing) throw new AppError('User with this email already exists', 400);

    const userData: any = {
      user_id: uuidv4(),
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

    if (password) userData.password = password;

    const user = await User.create(userData);
    const { password: _p, ...safeUser } = (user.toObject() as any);
    return ResponseUtil.success(res, safeUser, 'User created successfully', 201);
  });

  static updateGovernanceUser = catchAsync(async (req: Request, res: Response) => {
    const {
      user_name, phone, role, governance_role,
      permissions, assigned_brands, assigned_domains, workflow_rights, security, is_active,
    } = req.body;

    const allowedUpdates: Record<string, any> = {};
    if (user_name !== undefined) allowedUpdates.user_name = user_name;
    if (phone !== undefined) allowedUpdates.phone = phone;
    if (role !== undefined) allowedUpdates.role = role;
    if (governance_role !== undefined) allowedUpdates.governance_role = governance_role;
    if (permissions !== undefined) allowedUpdates.permissions = permissions;
    if (assigned_brands !== undefined) allowedUpdates.assigned_brands = assigned_brands;
    if (assigned_domains !== undefined) allowedUpdates.assigned_domains = assigned_domains;
    if (workflow_rights !== undefined) allowedUpdates.workflow_rights = workflow_rights;
    if (security !== undefined) allowedUpdates.security = security;
    if (is_active !== undefined) allowedUpdates.is_active = is_active;

    const user = await User.findOneAndUpdate(
      { user_id: req.params.id, is_deleted: false },
      allowedUpdates,
      { new: true }
    ).select('-password -password_reset_token -password_reset_expires');

    if (!user) throw new AppError('User not found', 404);
    return ResponseUtil.success(res, user, 'User updated');
  });

  static suspendUser = catchAsync(async (req: Request, res: Response) => {
    const user = await User.findOneAndUpdate(
      { user_id: req.params.id, is_deleted: false },
      { is_active: false },
      { new: true }
    ).select('-password');
    if (!user) throw new AppError('User not found', 404);
    return ResponseUtil.success(res, user, 'User suspended');
  });

  static activateUser = catchAsync(async (req: Request, res: Response) => {
    const user = await User.findOneAndUpdate(
      { user_id: req.params.id, is_deleted: false },
      { is_active: true },
      { new: true }
    ).select('-password');
    if (!user) throw new AppError('User not found', 404);
    return ResponseUtil.success(res, user, 'User activated');
  });

  // ─── PERMISSIONS ─────────────────────────────────────────────────────────
  static getUserPermissions = catchAsync(async (req: Request, res: Response) => {
    const permissions = await PermissionService.getUserPermissions(String(req.params.id));
    return ResponseUtil.success(res, { permissions }, 'Permissions retrieved');
  });

  static checkPermission = catchAsync(async (req: Request, res: Response) => {
    const user_id = str(req.query.user_id as any) || '';
    const permission = str(req.query.permission as any) || '';
    const allowed = await PermissionService.checkPermission(user_id, permission);
    return ResponseUtil.success(res, { allowed, user_id, permission }, 'Permission checked');
  });

  // ─── OWNERSHIP ───────────────────────────────────────────────────────────
  static getOwnershipGrid = catchAsync(async (_req: Request, res: Response) => {
    const grid = await OwnershipService.getOwnershipGrid();
    return ResponseUtil.success(res, grid, 'Ownership grid retrieved');
  });

  static getUnassignedBrands = catchAsync(async (_req: Request, res: Response) => {
    const brands = await OwnershipService.getUnassignedBrands();
    return ResponseUtil.success(res, brands, 'Unassigned brands retrieved');
  });

  static getWorkloadSummaries = catchAsync(async (_req: Request, res: Response) => {
    const summaries = await OwnershipService.getWorkloadSummaries();
    return ResponseUtil.success(res, summaries, 'Workload summaries retrieved');
  });

  static assignBrand = catchAsync(async (req: Request, res: Response) => {
    const { user_id, brand_id } = req.body;
    if (!user_id || !brand_id) throw new AppError('user_id and brand_id are required', 400);
    await OwnershipService.assignBrand(user_id, brand_id);
    return ResponseUtil.success(res, { user_id, brand_id }, 'Brand assigned');
  });

  static unassignBrand = catchAsync(async (req: Request, res: Response) => {
    const { user_id, brand_id } = req.body;
    if (!user_id || !brand_id) throw new AppError('user_id and brand_id are required', 400);
    await OwnershipService.unassignBrand(user_id, brand_id);
    return ResponseUtil.success(res, { user_id, brand_id }, 'Brand unassigned');
  });

  // ─── WORKFLOW ────────────────────────────────────────────────────────────
  static getWorkflowQueue = catchAsync(async (req: Request, res: Response) => {
    const page = Number(str(req.query.page as any) || 1);
    const limit = Number(str(req.query.limit as any) || 20);
    const status = str(req.query.status as any) as any;
    const entity_type = str(req.query.entity_type as any) as any;
    const submitted_by = str(req.query.submitted_by as any);
    const brand_id = str(req.query.brand_id as any);

    const result = await WorkflowService.getQueue({ status, entity_type, submitted_by, brand_id, page, limit });
    return ResponseUtil.paginated(res, result.items, buildPagination(result.page, result.limit, result.total), 'Workflow queue retrieved');
  });

  static getWorkflowStats = catchAsync(async (_req: Request, res: Response) => {
    const stats = await WorkflowService.getWorkflowStats();
    return ResponseUtil.success(res, stats, 'Workflow stats retrieved');
  });

  static submitForReview = catchAsync(async (req: AuthRequest, res: Response) => {
    const user = req.user;
    const item = await WorkflowService.submitForReview({
      ...req.body,
      submitted_by: String(user?.user_id || user?.id || ''),
      submitted_by_name: String((user as any)?.username || user?.user_id || ''),
    });
    return ResponseUtil.success(res, item, 'Submitted for review', 201);
  });

  static approveWorkflow = catchAsync(async (req: AuthRequest, res: Response) => {
    const user = req.user;
    const userId = String(user?.user_id || user?.id || '');
    const item = await WorkflowService.approve(String(req.params.id), userId, req.body.note);
    return ResponseUtil.success(res, item, 'Item approved');
  });

  static rejectWorkflow = catchAsync(async (req: AuthRequest, res: Response) => {
    const user = req.user;
    const userId = String(user?.user_id || user?.id || '');
    const item = await WorkflowService.reject(String(req.params.id), userId, req.body.reason);
    return ResponseUtil.success(res, item, 'Item rejected');
  });

  static publishWorkflow = catchAsync(async (req: AuthRequest, res: Response) => {
    const user = req.user;
    const userId = String(user?.user_id || user?.id || '');
    const item = await WorkflowService.publish(String(req.params.id), userId);
    return ResponseUtil.success(res, item, 'Item published');
  });

  // ─── ACTIVITY ────────────────────────────────────────────────────────────
  static getUserActivity = catchAsync(async (req: Request, res: Response) => {
    const page = Number(str(req.query.page as any) || 1);
    const limit = Number(str(req.query.limit as any) || 30);
    const entity_type = str(req.query.entity_type as any);
    const action = str(req.query.action as any);
    const date_from = str(req.query.date_from as any);
    const date_to = str(req.query.date_to as any);

    const result = await UserActivityService.getUserActivity(String(req.params.id), { page, limit, entity_type, action, date_from, date_to });
    return ResponseUtil.paginated(res, result.logs, buildPagination(result.page, result.limit, result.total), 'Activity retrieved');
  });

  static getUserActivitySummary = catchAsync(async (req: Request, res: Response) => {
    const summary = await UserActivityService.getUserActivitySummary(String(req.params.id));
    return ResponseUtil.success(res, summary, 'Activity summary retrieved');
  });

  static getAllActivity = catchAsync(async (req: Request, res: Response) => {
    const page = Number(str(req.query.page as any) || 1);
    const limit = Number(str(req.query.limit as any) || 30);
    const user_id = str(req.query.user_id as any);
    const entity_type = str(req.query.entity_type as any);
    const action = str(req.query.action as any);
    const date_from = str(req.query.date_from as any);
    const date_to = str(req.query.date_to as any);

    const result = await UserActivityService.getAllActivity({ page, limit, user_id, entity_type, action, date_from, date_to });
    return ResponseUtil.paginated(res, result.logs, buildPagination(result.page, result.limit, result.total), 'Activity retrieved');
  });

  static getCrossUserSummary = catchAsync(async (_req: Request, res: Response) => {
    const summary = await UserActivityService.getCrossUserActivitySummary();
    return ResponseUtil.success(res, summary, 'Cross-user summary retrieved');
  });

  // ─── EDIT LOCKS ──────────────────────────────────────────────────────────
  static acquireLock = catchAsync(async (req: AuthRequest, res: Response) => {
    const user = req.user;
    const { entity_type, entity_id } = req.body;
    if (!entity_type || !entity_id) throw new AppError('entity_type and entity_id are required', 400);

    const lock = await EditLockService.acquireLock(
      String(entity_type),
      String(entity_id),
      String(user?.user_id || user?.id || ''),
      String(user?.user_id || ''),
      String(user?.email || '')
    );
    return ResponseUtil.success(res, lock, 'Lock acquired');
  });

  static checkLock = catchAsync(async (req: Request, res: Response) => {
    const entity_type = str(req.query.entity_type as any) || '';
    const entity_id = str(req.query.entity_id as any) || '';
    const info = await EditLockService.checkLock(entity_type, entity_id);
    return ResponseUtil.success(res, info, 'Lock status retrieved');
  });

  static releaseLock = catchAsync(async (req: AuthRequest, res: Response) => {
    const user = req.user;
    const { entity_type, entity_id } = req.body;
    await EditLockService.releaseLock(String(entity_type), String(entity_id), String(user?.user_id || user?.id || ''));
    return ResponseUtil.success(res, null, 'Lock released');
  });

  static forceReleaseLock = catchAsync(async (req: Request, res: Response) => {
    const { entity_type, entity_id } = req.body;
    await EditLockService.forceRelease(entity_type, entity_id);
    return ResponseUtil.success(res, null, 'Lock force-released');
  });
}
