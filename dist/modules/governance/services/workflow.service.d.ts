import { IWorkflowItem, WorkflowEntityType, WorkflowStatus } from '../../../models/workflow-item.model';
export interface WorkflowQueueFilters {
    status?: WorkflowStatus;
    entity_type?: WorkflowEntityType;
    submitted_by?: string;
    brand_id?: string;
    page?: number;
    limit?: number;
}
export declare class WorkflowService {
    static getQueue(filters?: WorkflowQueueFilters): Promise<{
        items: (IWorkflowItem & import("../../../sql/common/BaseModel").SQLDocument)[];
        total: number;
        page: number;
        limit: number;
    }>;
    static submitForReview(params: {
        entity_type: WorkflowEntityType;
        entity_id: string;
        entity_name: string;
        brand_id?: string;
        brand_name?: string;
        submitted_by: string;
        submitted_by_name: string;
        publish_risk?: 'low' | 'medium' | 'high';
    }): Promise<IWorkflowItem>;
    static approve(workflowId: string, reviewerId: string, note?: string): Promise<IWorkflowItem>;
    static reject(workflowId: string, reviewerId: string, reason: string): Promise<IWorkflowItem>;
    static publish(workflowId: string, publisherId: string): Promise<IWorkflowItem>;
    static getWorkflowStats(): Promise<{
        pending: number;
        approved: number;
        published: number;
        rejected: number;
    }>;
}
