"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportConfidenceService = void 0;
const import_log_model_1 = require("../../../models/import-log.model");
const source_priority_config_1 = require("../rules/source-priority-config");
const app_error_util_1 = require("../../../shared/utils/app-error.util");
class ImportConfidenceService {
    static async scoreImport(import_id) {
        const log = await import_log_model_1.ImportLog.findOne({ import_id, is_deleted: false });
        if (!log) {
            throw app_error_util_1.AppError.notFound('Import', 'import_id', import_id);
        }
        const matched = log.matched_data?.matched || [];
        const unmatched = log.unmatched_data?.unmatched || [];
        const errors = (Array.isArray(log.errors) ? log.errors : []);
        const warnings = (log.warnings || []);
        const totalFields = matched.length + unmatched.length;
        const exactMatches = matched.filter((m) => m.matchType === 'exact').length;
        const fuzzyMatches = matched.filter((m) => m.matchType === 'fuzzy').length;
        // Component scores
        const matchQualityScore = totalFields > 0 ? (exactMatches / totalFields) * 100 : 0;
        const sourceReliabilityScore = source_priority_config_1.SourcePriorityEngine.getPriorityForSource(log.source || 'cardekho');
        const validationScore = this.calculateValidationScore(errors, warnings);
        const coverageScore = totalFields > 0 ? ((matched.length / totalFields) * 100) : 0;
        // Weighted overall score
        const overallScore = matchQualityScore * 0.35 +
            sourceReliabilityScore * 0.25 +
            validationScore * 0.25 +
            coverageScore * 0.15;
        // Recommendation logic
        let recommendation;
        if (overallScore >= 85 && validationScore === 100 && exactMatches === matched.length) {
            recommendation = 'auto_publish';
        }
        else if (overallScore >= 70) {
            recommendation = 'review_required';
        }
        else {
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
    static async scoreVariantImports(variant_id) {
        const logs = await import_log_model_1.ImportLog.find({
            variant_id,
            import_type: 'variant',
            is_deleted: false,
        });
        const scores = await Promise.all(logs.map(log => this.scoreImport(log.import_id)));
        return scores.sort((a, b) => b.overall_score - a.overall_score);
    }
    static async scoreCarImports(car_id) {
        const logs = await import_log_model_1.ImportLog.find({
            car_id,
            is_deleted: false,
        });
        const scores = await Promise.all(logs.map(log => this.scoreImport(log.import_id)));
        return scores.sort((a, b) => b.overall_score - a.overall_score);
    }
    static async getBatchQualityReport(limit = 100) {
        const recentLogs = await import_log_model_1.ImportLog.find({ is_deleted: false })
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
    static calculateValidationScore(errors, warnings) {
        if (errors.length === 0 && warnings.length === 0) {
            return 100;
        }
        let score = 100;
        score -= Math.min(errors.length * 20, 50); // Each error reduces score by 20, max 50
        score -= Math.min(warnings.length * 5, 20); // Each warning reduces score by 5, max 20
        return Math.max(score, 0);
    }
}
exports.ImportConfidenceService = ImportConfidenceService;
//# sourceMappingURL=import-confidence.service.js.map