"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChangeHistoryTracker = void 0;
class ChangeHistoryTracker {
    static createEntry(field, oldValue, newValue, changedBy, changeSource = 'manual_edit', notes) {
        return {
            field,
            old_value: oldValue,
            new_value: newValue,
            changed_by: changedBy,
            changed_at: new Date(),
            change_source: changeSource,
            notes,
        };
    }
    static createSpecEntry(field, oldValue, newValue, changedBy, section, changeSource = 'manual_edit', options) {
        return {
            field,
            old_value: oldValue,
            new_value: newValue,
            changed_by: changedBy,
            changed_at: new Date(),
            change_source: changeSource,
            section,
            data_type: options?.dataType,
            confidence: options?.confidence,
            source_system: options?.sourceSystem,
            notes: options?.notes,
        };
    }
    static detectChanges(oldDoc, newDoc, fieldsToTrack) {
        const changes = [];
        const fields = fieldsToTrack || Object.keys(newDoc);
        for (const field of fields) {
            const oldValue = oldDoc[field];
            const newValue = newDoc[field];
            if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
                changes.push({
                    field,
                    oldValue,
                    newValue,
                });
            }
        }
        return changes;
    }
    static detectSpecChanges(oldSpecs, newSpecs) {
        const changes = [];
        const sections = new Set([
            ...Object.keys(oldSpecs || {}),
            ...Object.keys(newSpecs || {}),
        ]);
        for (const section of sections) {
            const oldSection = oldSpecs?.[section] || {};
            const newSection = newSpecs?.[section] || {};
            const fields = new Set([...Object.keys(oldSection), ...Object.keys(newSection)]);
            for (const field of fields) {
                const oldValue = oldSection[field];
                const newValue = newSection[field];
                if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
                    changes.push({
                        field,
                        section,
                        oldValue,
                        newValue,
                    });
                }
            }
        }
        return changes;
    }
    static summarizeChanges(changes) {
        return {
            totalChanges: changes.length,
            changedFields: new Set(changes.map((c) => c.field)),
            changedBy: new Set(changes.map((c) => c.changed_by)),
            changeSources: new Set(changes.map((c) => c.change_source)),
            latestChange: changes.length > 0 ? changes[changes.length - 1] : null,
        };
    }
    static filterChangesByDateRange(changes, startDate, endDate) {
        return changes.filter((c) => c.changed_at >= startDate && c.changed_at <= endDate);
    }
    static filterChangesByField(changes, field) {
        return changes.filter((c) => c.field === field);
    }
    static filterChangesBySource(changes, source) {
        return changes.filter((c) => c.change_source === source);
    }
    static auditTrail(changes) {
        if (changes.length === 0)
            return 'No changes recorded.';
        return changes
            .map((c) => `[${c.changed_at.toISOString()}] ${c.field}: ${JSON.stringify(c.old_value)} → ${JSON.stringify(c.new_value)} (by ${c.changed_by}, source: ${c.change_source})`)
            .join('\n');
    }
}
exports.ChangeHistoryTracker = ChangeHistoryTracker;
