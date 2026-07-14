/**
 * Audit & Operations Center aggregation layer.
 *
 * This service does NOT introduce new collections. It aggregates existing
 * sources (AuditLog, ImportLog, ContentHealth, lifecycle + SEO collection
 * state) into the views the unified /audit page needs. Everything is computed
 * on demand — no alerts or activity snapshots are ever stored.
 */
export interface ActivityParams {
    page?: number;
    limit?: number;
    entity_type?: string;
    entity_id?: string;
    action?: string;
    actor_user_id?: string;
    from?: string;
    to?: string;
}
export interface ChangeItem {
    field: string | null;
    old_value: unknown;
    new_value: unknown;
    audit_id: string;
}
export interface ActivityEvent {
    event_key: string;
    entity_type: string;
    entity_id: string;
    entity_name: string | null;
    action: string;
    timestamp: Date;
    actor_user_id: string | null;
    actor_name: string | null;
    actor_email: string | null;
    actor_role: string | null;
    changes: ChangeItem[];
    change_count: number;
}
type EntityKey = `${string}:${string}`;
export declare class AuditOperationsService {
    /**
     * Resolve `{ entity_type, entity_id }` pairs to human-readable names in batch,
     * one query per entity type. Returns a `"type:id" -> name` map.
     */
    static resolveEntityNames(pairs: Array<{
        entity_type: string;
        entity_id: string;
    }>): Promise<Record<EntityKey, string>>;
    /**
     * Group per-field AuditLog rows into events. recordChanges() writes one row
     * per field with an identical timestamp for a single save, so grouping by
     * (entity, action, timestamp, actor) reconstructs the original action and its
     * full set of field changes — powering both the timeline and Change Inspector.
     */
    static getActivity(params: ActivityParams): Promise<{
        events: ActivityEvent[];
        pagination: import("../../../shared/interfaces/pagination-response.interface").PaginationMeta;
    }>;
    /** Attach resolved entity names + actor names to raw aggregation rows. */
    private static hydrateEvents;
    /**
     * Confidence is derived (ImportLog has no stored score): the share of fields
     * that matched vs. total fields seen. Returns 0–100 or null when unknown.
     */
    private static deriveConfidence;
    static getImports(params: {
        page?: number;
        limit?: number;
        status?: string;
        import_type?: string;
        source?: string;
    }): Promise<{
        summary: {
            successful: number;
            failed: number;
            previewed: number;
            low_confidence_on_page: number;
            total: number;
        };
        logs: {
            import_id: string;
            source: import("../../../models/import-log.model").ImportSource;
            import_type: import("../../../models/import-log.model").ImportType;
            source_url: string;
            car_id: string | null;
            variant_id: string | null;
            status: import("../../../models/import-log.model").ImportStatus;
            confidence: number | null;
            is_low_confidence: boolean;
            matched_count: number;
            unmatched_count: number;
            warning_count: number;
            error_count: number;
            created_by: string;
            created_by_name: string;
            createdAt: Date;
        }[];
        pagination: import("../../../shared/interfaces/pagination-response.interface").PaginationMeta;
    }>;
    static getImportDetail(importId: string): Promise<Record<string, unknown> | null>;
    static getAlerts(): Promise<{
        alerts: {
            id: string;
            source: string;
            severity: "critical" | "warning" | "info";
            title: string;
            description: string;
            count: number;
            action_label: string;
            action_url: string;
        }[];
        counts: {
            critical: number;
            warning: number;
            info: number;
            total: number;
        };
        generated_at: string;
    }>;
    static searchEntities(q: string, limit?: number): Promise<{
        entity_type: string;
        entity_id: string;
        label: string;
        sub?: string;
    }[]>;
    /**
     * Complete chronological history of an entity: audit events + related imports.
     * For a car, this also folds in audit events for all of its variants so the
     * timeline reflects the entire model, not just the parent record.
     */
    static getEntityHistory(entityType: string, entityId: string): Promise<{
        entity_type: string;
        entity_id: string;
        entity_name: string;
        variant_count: number;
        timeline: {
            kind: "audit" | "import";
            timestamp: Date;
            event: unknown;
        }[];
    }>;
}
export {};
