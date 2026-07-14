export type WorkflowStatus = 'pending_review' | 'approved' | 'rejected' | 'published';
export type WorkflowEntityType = 'car' | 'variant' | 'seo_collection' | 'blog' | 'faq' | 'redirect';
export type PublishRisk = 'low' | 'medium' | 'high';

export interface IWorkflowItem  {
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

import { BaseModel } from '../sql/common/BaseModel';
export const WorkflowItem = new BaseModel<IWorkflowItem>('WorkflowItems', 'item_id', ['history']);
