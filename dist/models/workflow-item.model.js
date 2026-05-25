"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowItem = void 0;
const mongoose_1 = require("mongoose");
const workflowItemSchema = new mongoose_1.Schema({
    workflow_id: { type: String, required: true, unique: true },
    entity_type: {
        type: String,
        enum: ['car', 'variant', 'seo_collection', 'blog', 'faq', 'redirect'],
        required: true,
    },
    entity_id: { type: String, required: true },
    entity_name: { type: String, required: true },
    brand_id: { type: String },
    brand_name: { type: String },
    status: {
        type: String,
        enum: ['pending_review', 'approved', 'rejected', 'published'],
        default: 'pending_review',
    },
    submitted_by: { type: String, required: true },
    submitted_by_name: { type: String, required: true },
    reviewer_id: { type: String },
    reviewer_name: { type: String },
    publisher_id: { type: String },
    reviewer_note: { type: String },
    rejected_reason: { type: String },
    submitted_at: { type: Date, default: Date.now },
    reviewed_at: { type: Date },
    published_at: { type: Date },
    publish_risk: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'low',
    },
}, { timestamps: true });
workflowItemSchema.index({ status: 1 });
workflowItemSchema.index({ submitted_by: 1 });
workflowItemSchema.index({ entity_type: 1, entity_id: 1 });
workflowItemSchema.index({ brand_id: 1 });
exports.WorkflowItem = (0, mongoose_1.model)('WorkflowItem', workflowItemSchema);
//# sourceMappingURL=workflow-item.model.js.map