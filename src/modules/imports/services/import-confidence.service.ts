import { ImportLog } from '../../../models/import-log.model';
import { CarVariant } from '../../../models/car-variant.model';
import { SourcePriorityEngine, SourceType } from '../rules/source-priority-config';

export interface ImportConfidenceScore {
  import_id: string;
  variant_id?: string;
  car_id?: string;
  overall_score: number; // 0-100
  components: {
    match_quality_score: number; // 0-100: % of exact matches
    source_reliability_score: number; // 0-100: based on source priority
    validation_score: number; // 0-100: passes = 100, each error reduces score
    coverage_score: number; // 0-100: % of key fields populated
  };
  details: {
    total_fields: number;
    exact_matches: number;
    fuzzy_matches: number;
    unmatched: number;
    validation_errors: number;
    validation_warnings: number;
  };
  recommendation: 'auto_publish' | 'review_required' | 'needs_manual_work';
}

export class ImportConfidenceService {
  static async scoreImport(import_id: string): Promise<ImportConfidenceScore> {
    const log = await ImportLog.findOne({ import_id, is_deleted: false });
    if (!log) {
      throw new Error(`Import ${import_id} not found`);
    }

    const matched = (log.matched_data?.matched as any[]) || [];
    const unmatched = (log.unmatched_data?.unmatched as any[]) || [];
    const errors = (Array.isArray(log.errors) ? log.errors : []) as any[];
    const warnings = (log.warnings || []) as any[];

    const totalFields = matched.length + unmatched.length;
    const exactMatches = matched.filter((m: any) => m.matchType === 'exact').length;
    const fuzzyMatches = matched.filter((m: any) => m.matchType === 'fuzzy').length;

    // Component scores
    const matchQualityScore = totalFields > 0 ? (exactMatches / totalFields) * 100 : 0;
    const sourceReliabilityScore = SourcePriorityEngine.getPriorityForSource((log.source as SourceType) || 'cardekho');
    const validationScore = this.calculateValidationScore(errors, warnings);
    const coverageScore = totalFields > 0 ? ((matched.length / totalFields) * 100) : 0;

    // Weighted overall score
    const overallScore =
      matchQualityScore * 0.35 +
      sourceReliabilityScore * 0.25 +
      validationScore * 0.25 +
      coverageScore * 0.15;

    // Recommendation logic
    let recommendation: 'auto_publish' | 'review_required' | 'needs_manual_work';
    if (overallScore >= 85 && validationScore === 100 && exactMatches === matched.length) {
      recommendation = 'auto_publish';
    } else if (overallScore >= 70) {
      recommendation = 'review_required';
    } else {
      recommendation = 'needs_manual_work';
    }

    return {
      import_id,
      variant_id: log.variant_id,
      car_id: log.car_id,
      overall_score: Math.round(overallScore * 10) / 10,
      components: {
        match_quality_score: Math.round(matchQualityScore * 10) / 10,
        source_reliability_score: sourceReliabilityScore,
        validation_score: validationScore,
        coverage_score: Math.round(coverageScore * 10) / 10,
      },
      details: {
        total_fields: totalFields,
        exact_matches: exactMatches,
        fuzzy_matches: fuzzyMatches,
        unmatched: unmatched.length,
        validation_errors: errors.length,
        validation_warnings: warnings.length,
      },
      recommendation,
    };
  }

  static async scoreVariantImports(variant_id: string): Promise<ImportConfidenceScore[]> {
    const logs = await ImportLog.find({
      variant_id,
      import_type: 'variant',
      is_deleted: false,
    });

    const scores = await Promise.all(logs.map(log => this.scoreImport(log.import_id)));
    return scores.sort((a, b) => b.overall_score - a.overall_score);
  }

  static async scoreCarImports(car_id: string): Promise<ImportConfidenceScore[]> {
    const logs = await ImportLog.find({
      car_id,
      is_deleted: false,
    });

    const scores = await Promise.all(logs.map(log => this.scoreImport(log.import_id)));
    return scores.sort((a, b) => b.overall_score - a.overall_score);
  }

  static async getBatchQualityReport(limit: number = 100): Promise<{
    avg_confidence: number;
    high_confidence: number;
    medium_confidence: number;
    low_confidence: number;
    recent_imports: ImportConfidenceScore[];
  }> {
    const recentLogs = await ImportLog.find({ is_deleted: false })
      .sort({ createdAt: -1 })
      .limit(limit);

    const scores = await Promise.all(recentLogs.map(log => this.scoreImport(log.import_id)));

    const highConfidence = scores.filter(s => s.overall_score >= 85).length;
    const mediumConfidence = scores.filter(s => s.overall_score >= 70 && s.overall_score < 85).length;
    const lowConfidence = scores.filter(s => s.overall_score < 70).length;
    const avgConfidence = scores.reduce((sum, s) => sum + s.overall_score, 0) / scores.length;

    return {
      avg_confidence: Math.round(avgConfidence * 10) / 10,
      high_confidence: highConfidence,
      medium_confidence: mediumConfidence,
      low_confidence: lowConfidence,
      recent_imports: scores.slice(0, 10),
    };
  }

  private static calculateValidationScore(errors: any[], warnings: any[]): number {
    if (errors.length === 0 && warnings.length === 0) {
      return 100;
    }

    let score = 100;
    score -= Math.min(errors.length * 20, 50); // Each error reduces score by 20, max 50
    score -= Math.min(warnings.length * 5, 20); // Each warning reduces score by 5, max 20

    return Math.max(score, 0);
  }
}
