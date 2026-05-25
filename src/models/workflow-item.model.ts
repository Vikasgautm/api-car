import { Document, Schema, model } from 'mongoose';

export type WorkflowStatus = 'pending_review' | 'approved' | 'rejected' | 'published';
export type WorkflowEntityType = 'car' | 'variant' | 'seo_collection' | 'blog' | 'faq' | 'redirect';
export type PublishRisk = 'low' | 'medium' | 'high';

export interface IWorkflowItem extends Document {
  workflow_id: string;
  entity_type: WorkflowEntityType;
  entity_id: string;
  entity_name: string;
  brand_id?: string;
  brand_name?: string;
  status: WorkflowStatus;
  submitted_by: string;
  submitted_by_name: string;
  reviewer_id?: string;
  reviewer_name?: string;
  publisher_id?: string;
  reviewer_note?: string;
  rejected_reason?: string;
  submitted_at: Date;
  reviewed_at?: Date;
  published_at?: Date;
  publish_risk: PublishRisk;
}

const workflowItemSchema = new Schema<IWorkflowItem>(
  {
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
  },
  { timestamps: true }
);

workflowItemSchema.index({ status: 1 });
workflowItemSchema.index({ submitted_by: 1 });
workflowItemSchema.index({ entity_type: 1, entity_id: 1 });
workflowItemSchema.index({ brand_id: 1 });

export const WorkflowItem = model<IWorkflowItem>('WorkflowItem', workflowItemSchema);
