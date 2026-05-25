"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowService = void 0;
const uuid_1 = require("uuid");
const workflow_item_model_1 = require("../../../models/workflow-item.model");
const user_model_1 = require("../../../models/user.model");
const app_error_util_1 = require("../../../shared/utils/app-error.util");
class WorkflowService {
    static async getQueue(filters = {}) {
        const { status, entity_type, submitted_by, brand_id, page = 1, limit = 20 } = filters;
        const query = {};
        if (status)
            query.status = status;
        if (entity_type)
            query.entity_type = entity_type;
        if (submitted_by)
            query.submitted_by = submitted_by;
        if (brand_id)
            query.brand_id = brand_id;
        const skip = (page - 1) * limit;
        const [items, total] = await Promise.all([
            workflow_item_model_1.WorkflowItem.find(query).sort({ submitted_at: -1 }).skip(skip).limit(limit),
            workflow_item_model_1.WorkflowItem.countDocuments(query),
        ]);
        return { items, total, page, limit };
    }
    static async submitForReview(params) {
        const existing = await workflow_item_model_1.WorkflowItem.findOne({
            entity_type: params.entity_type,
            entity_id: params.entity_id,
            status: 'pending_review',
        });
        if (existing) {
            throw new app_error_util_1.AppError('This item is already pending review', 409);
        }
        const item = await workflow_item_model_1.WorkflowItem.create({
            workflow_id: (0, uuid_1.v4)(),
            ...params,
            status: 'pending_review',
            submitted_at: new Date(),
            publish_risk: params.publish_risk || 'low',
        });
        return item;
    }
    static async approve(workflowId, reviewerId, note) {
        const item = await workflow_item_model_1.WorkflowItem.findOne({ workflow_id: workflowId, status: 'pending_review' });
        if (!item)
            throw new app_error_util_1.AppError('Workflow item not found or not pending review', 404);
        const reviewer = await user_model_1.User.findOne({ user_id: reviewerId, is_deleted: false });
        if (!reviewer?.workflow_rights?.can_review && reviewer?.role !== 'super_admin' && reviewer?.role !== 'admin') {
            throw new app_error_util_1.AppError('You do not have review rights', 403);
        }
        item.status = 'approved';
        item.reviewer_id = reviewerId;
        item.reviewer_name = reviewer.user_name;
        item.reviewer_note = note;
        item.reviewed_at = new Date();
        await item.save();
        return item;
    }
    static async reject(workflowId, reviewerId, reason) {
        const item = await workflow_item_model_1.WorkflowItem.findOne({ workflow_id: workflowId, status: 'pending_review' });
        if (!item)
            throw new app_error_util_1.AppError('Workflow item not found or not pending review', 404);
        const reviewer = await user_model_1.User.findOne({ user_id: reviewerId, is_deleted: false });
        if (!reviewer?.workflow_rights?.can_review && reviewer?.role !== 'super_admin' && reviewer?.role !== 'admin') {
            throw new app_error_util_1.AppError('You do not have review rights', 403);
        }
        item.status = 'rejected';
        item.reviewer_id = reviewerId;
        item.reviewer_name = reviewer.user_name;
        item.rejected_reason = reason;
        item.reviewed_at = new Date();
        await item.save();
        return item;
    }
    static async publish(workflowId, publisherId) {
        const item = await workflow_item_model_1.WorkflowItem.findOne({ workflow_id: workflowId, status: 'approved' });
        if (!item)
            throw new app_error_util_1.AppError('Workflow item not found or not approved', 404);
        const publisher = await user_model_1.User.findOne({ user_id: publisherId, is_deleted: false });
        if (!publisher?.workflow_rights?.can_publish && publisher?.role !== 'super_admin' && publisher?.role !== 'admin') {
            throw new app_error_util_1.AppError('You do not have publish rights', 403);
        }
        item.status = 'published';
        item.publisher_id = publisherId;
        item.published_at = new Date();
        await item.save();
        return item;
    }
    static async getWorkflowStats() {
        const [pending, approved, published, rejected] = await Promise.all([
            workflow_item_model_1.WorkflowItem.countDocuments({ status: 'pending_review' }),
            workflow_item_model_1.WorkflowItem.countDocuments({ status: 'approved' }),
            workflow_item_model_1.WorkflowItem.countDocuments({ status: 'published' }),
            workflow_item_model_1.WorkflowItem.countDocuments({ status: 'rejected' }),
        ]);
        return { pending, approved, published, rejected };
    }
}
exports.WorkflowService = WorkflowService;
//# sourceMappingURL=workflow.service.js.map