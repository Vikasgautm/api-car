import { v4 as uuidv4 } from 'uuid';
import { IWorkflowItem, WorkflowEntityType, WorkflowItem, WorkflowStatus } from '../../../models/workflow-item.model';
import { User } from '../../../models/user.model';
import { AppError } from '../../../shared/utils/app-error.util';

export interface WorkflowQueueFilters {
  status?: WorkflowStatus;
  entity_type?: WorkflowEntityType;
  submitted_by?: string;
  brand_id?: string;
  page?: number;
  limit?: number;
}

export class WorkflowService {
  static async getQueue(filters: WorkflowQueueFilters = {}) {
    const { status, entity_type, submitted_by, brand_id, page = 1, limit = 20 } = filters;
    const query: Record<string, any> = {};

    if (status) query.status = status;
    if (entity_type) query.entity_type = entity_type;
    if (submitted_by) query.submitted_by = submitted_by;
    if (brand_id) query.brand_id = brand_id;

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      WorkflowItem.find(query).sort({ submitted_at: -1 }).skip(skip).limit(limit),
      WorkflowItem.countDocuments(query),
    ]);

    return { items, total, page, limit };
  }

  static async submitForReview(params: {
    entity_type: WorkflowEntityType;
    entity_id: string;
    entity_name: string;
    brand_id?: string;
    brand_name?: string;
    submitted_by: string;
    submitted_by_name: string;
    publish_risk?: 'low' | 'medium' | 'high';
  }): Promise<IWorkflowItem> {
    const existing = await WorkflowItem.findOne({
      entity_type: params.entity_type,
      entity_id: params.entity_id,
      status: 'pending_review',
    });
    if (existing) {
      throw new AppError('This item is already pending review', 409);
    }

    const item = await WorkflowItem.create({
      workflow_id: uuidv4(),
      ...params,
      status: 'pending_review',
      submitted_at: new Date(),
      publish_risk: params.publish_risk || 'low',
    });
    return item;
  }

  static async approve(workflowId: string, reviewerId: string, note?: string): Promise<IWorkflowItem> {
    const item = await WorkflowItem.findOne({ workflow_id: workflowId, status: 'pending_review' });
    if (!item) throw new AppError('Workflow item not found or not pending review', 404);

    const reviewer = await User.findOne({ user_id: reviewerId, is_deleted: false });
    if (!reviewer?.workflow_rights?.can_review && reviewer?.role !== 'super_admin' && reviewer?.role !== 'admin') {
      throw new AppError('You do not have review rights', 403);
    }

    item.status = 'approved';
    item.reviewer_id = reviewerId;
    item.reviewer_name = reviewer.user_name;
    item.reviewer_note = note;
    item.reviewed_at = new Date();
    await item.save();
    return item;
  }

  static async reject(workflowId: string, reviewerId: string, reason: string): Promise<IWorkflowItem> {
    const item = await WorkflowItem.findOne({ workflow_id: workflowId, status: 'pending_review' });
    if (!item) throw new AppError('Workflow item not found or not pending review', 404);

    const reviewer = await User.findOne({ user_id: reviewerId, is_deleted: false });
    if (!reviewer?.workflow_rights?.can_review && reviewer?.role !== 'super_admin' && reviewer?.role !== 'admin') {
      throw new AppError('You do not have review rights', 403);
    }

    item.status = 'rejected';
    item.reviewer_id = reviewerId;
    item.reviewer_name = reviewer.user_name;
    item.rejected_reason = reason;
    item.reviewed_at = new Date();
    await item.save();
    return item;
  }

  static async publish(workflowId: string, publisherId: string): Promise<IWorkflowItem> {
    const item = await WorkflowItem.findOne({ workflow_id: workflowId, status: 'approved' });
    if (!item) throw new AppError('Workflow item not found or not approved', 404);

    const publisher = await User.findOne({ user_id: publisherId, is_deleted: false });
    if (!publisher?.workflow_rights?.can_publish && publisher?.role !== 'super_admin' && publisher?.role !== 'admin') {
      throw new AppError('You do not have publish rights', 403);
    }

    item.status = 'published';
    item.publisher_id = publisherId;
    item.published_at = new Date();
    await item.save();
    return item;
  }

  static async getWorkflowStats() {
    const [pending, approved, published, rejected] = await Promise.all([
      WorkflowItem.countDocuments({ status: 'pending_review' }),
      WorkflowItem.countDocuments({ status: 'approved' }),
      WorkflowItem.countDocuments({ status: 'published' }),
      WorkflowItem.countDocuments({ status: 'rejected' }),
    ]);
    return { pending, approved, published, rejected };
  }
}
