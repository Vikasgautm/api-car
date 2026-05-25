import { IRankingRawEvent } from '../../../models/ranking-raw-event.model';
import { IRankingSession } from '../../../models/ranking-session.model';
interface QualityResult {
    session_quality_score: number;
    session_confidence: number;
    signals: IRankingSession['signals'];
    is_bounce: boolean;
}
export declare class SessionQualityService {
    static computeForSession(sessionId: string, events: IRankingRawEvent[]): Promise<QualityResult>;
    private static computeAttentionStrength;
    private static computeTimeConfidence;
    private static computeScrollConfidence;
    private static computeRevisitConfidence;
    private static computeExplorationStrength;
    private static computeSpecDepth;
    private static computeGalleryDepth;
    private static computeFaqDepth;
    private static computeFeatureToolDepth;
    private static computeEvaluationStrength;
    private static computeComparisonDepth;
    private static computeVariantAnalysis;
    private static computeRepeatEvaluation;
    private static computeCommercialStrength;
    private static computeEmiConfidence;
    private static computeBrochureConfidence;
    private static computeDealerConfidence;
    private static computeNoisePenalty;
    static recomputeAndSave(sessionId: string): Promise<void>;
    private static emptySignals;
}
export {};
//# sourceMappingURL=session-quality.service.d.ts.map