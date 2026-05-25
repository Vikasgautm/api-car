import { IRankingRawEvent } from '../../../models/ranking-raw-event.model';
interface IngestEventDto {
    event_type: string;
    entity_type: string;
    entity_id: string;
    variant_id?: string;
    session_id: string;
    user_id?: string;
    anonymous_id?: string;
    timestamp?: string | Date;
    page_url?: string;
    referrer?: string;
    traffic_source?: string;
    device_type?: string;
    city?: string;
    state?: string;
    active_tab?: boolean;
    duration_ms?: number;
    metadata?: Record<string, any>;
}
export declare class EventIngestionService {
    static ingest(dto: IngestEventDto): Promise<IRankingRawEvent>;
    static ingestBatch(events: IngestEventDto[]): Promise<{
        accepted: number;
        rejected: number;
    }>;
    private static computeEventConfidence;
    private static upsertSession;
}
export {};
//# sourceMappingURL=event-ingestion.service.d.ts.map