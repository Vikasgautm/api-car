"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetadataBuilder = exports.SourcePriorityMerge = exports.SourcePriority = void 0;
var SourcePriority;
(function (SourcePriority) {
    SourcePriority[SourcePriority["OEM_BROCHURE"] = 1] = "OEM_BROCHURE";
    SourcePriority[SourcePriority["OEM_WEBSITE"] = 2] = "OEM_WEBSITE";
    SourcePriority[SourcePriority["CAR_DEKHO"] = 3] = "CAR_DEKHO";
    SourcePriority[SourcePriority["CAR_WALE"] = 4] = "CAR_WALE";
    SourcePriority[SourcePriority["ZIG_WHEELS"] = 5] = "ZIG_WHEELS";
    SourcePriority[SourcePriority["AI_EXTRACTION"] = 6] = "AI_EXTRACTION";
})(SourcePriority || (exports.SourcePriority = SourcePriority = {}));
class SourcePriorityMerge {
    static getSourcePriority(source) {
        const lowerSource = source.toLowerCase();
        if (lowerSource.includes('oem') && lowerSource.includes('brochure'))
            return SourcePriority.OEM_BROCHURE;
        if (lowerSource.includes('oem') && lowerSource.includes('website'))
            return SourcePriority.OEM_WEBSITE;
        if (lowerSource.includes('cardekho') || lowerSource.includes('car dekho'))
            return SourcePriority.CAR_DEKHO;
        if (lowerSource.includes('carwale') || lowerSource.includes('car wale'))
            return SourcePriority.CAR_WALE;
        if (lowerSource.includes('zigwheels') || lowerSource.includes('zig wheels'))
            return SourcePriority.ZIG_WHEELS;
        if (lowerSource.includes('ai') || lowerSource.includes('llm'))
            return SourcePriority.AI_EXTRACTION;
        return SourcePriority.AI_EXTRACTION;
    }
    static mergeFields(existing, incoming) {
        // No existing value, always accept incoming
        if (!existing) {
            return { merged: incoming, changed: true };
        }
        // Same source and value, no change
        if (existing.source === incoming.source &&
            JSON.stringify(existing.value) === JSON.stringify(incoming.value)) {
            return { merged: existing, changed: false };
        }
        // Compare priorities
        const existingPriority = existing.source_priority || SourcePriority.AI_EXTRACTION;
        const incomingPriority = incoming.source_priority || SourcePriority.AI_EXTRACTION;
        // Higher priority source (lower number) overrides
        if (incomingPriority < existingPriority) {
            return { merged: incoming, changed: true };
        }
        // Same priority: prefer higher confidence
        if (incomingPriority === existingPriority) {
            const existingConf = existing.confidence || 0;
            const incomingConf = incoming.confidence || 0;
            if (incomingConf > existingConf) {
                return { merged: incoming, changed: true };
            }
        }
        // Keep existing if it has higher priority or equal priority with higher/equal confidence
        return { merged: existing, changed: false };
    }
    static mergeVariantSpecs(existing, existingMetadata, incoming, incomingMetadata) {
        const merged = { ...existing };
        const mergedMetadata = { ...existingMetadata };
        const changes = [];
        // Merge all incoming fields
        for (const [field, incomingValue] of Object.entries(incoming)) {
            const incomingMeta = incomingMetadata[field] || { value: incomingValue };
            const existingMeta = existingMetadata[field];
            const oldValue = existing[field];
            const { merged: resultMeta, changed } = this.mergeFields(existingMeta, incomingMeta);
            if (changed) {
                merged[field] = resultMeta.value;
                mergedMetadata[field] = resultMeta;
                changes.push({
                    field,
                    old_value: oldValue,
                    new_value: resultMeta.value,
                    reason: `Source: ${resultMeta.source} (priority ${resultMeta.source_priority}, confidence ${resultMeta.confidence})`,
                });
            }
        }
        return { merged, mergedMetadata, changes };
    }
}
exports.SourcePriorityMerge = SourcePriorityMerge;
class MetadataBuilder {
    static fromImportSource(value, source, confidence = 85, timestamp = new Date()) {
        return {
            value,
            source,
            source_priority: SourcePriorityMerge.getSourcePriority(source),
            confidence,
            last_updated: timestamp,
        };
    }
    static fromManualEdit(value, editedBy, timestamp = new Date()) {
        return {
            value,
            source: 'Manual Edit',
            source_priority: SourcePriority.OEM_BROCHURE,
            confidence: 100,
            last_updated: timestamp,
            last_updated_by: editedBy,
        };
    }
    static fromEstimate(value, confidence = 50, timestamp = new Date()) {
        return {
            value,
            source: 'Estimated',
            source_priority: SourcePriority.AI_EXTRACTION,
            confidence,
            is_estimated: true,
            last_updated: timestamp,
        };
    }
}
exports.MetadataBuilder = MetadataBuilder;
//# sourceMappingURL=field-source-metadata.js.map