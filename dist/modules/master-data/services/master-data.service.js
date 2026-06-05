"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MasterDataService = void 0;
const uuid_1 = require("uuid");
const master_option_model_1 = require("../models/master-option.model");
const unknown_value_model_1 = require("../models/unknown-value.model");
const app_error_util_1 = require("../../../shared/utils/app-error.util");
const cache_util_1 = require("../../../utils/cache.util");
const CACHE_KEY = 'master_data:all_active';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
class MasterDataService {
    // ── Query ────────────────────────────────────────────────────────────────────
    static async getCategories() {
        return master_option_model_1.MASTER_CATEGORIES;
    }
    static async getOptions(categoryKey, includeInactive = false) {
        const filter = { category_key: categoryKey };
        if (!includeInactive)
            filter.is_active = true;
        return master_option_model_1.MasterOption.find(filter).sort({ sort_order: 1, label: 1 }).lean();
    }
    static async getOptionByValue(categoryKey, value) {
        return master_option_model_1.MasterOption.findOne({ category_key: categoryKey, value }).lean();
    }
    // Returns all active options for every category in one round-trip.
    // Result is cached for 5 minutes; invalidated by any mutation.
    static async getAllActiveOptions() {
        const cached = cache_util_1.cache.get(CACHE_KEY);
        if (cached)
            return cached;
        const all = await master_option_model_1.MasterOption.find({ is_active: true }).sort({ category_key: 1, sort_order: 1 }).lean();
        const map = {};
        for (const opt of all) {
            if (!map[opt.category_key])
                map[opt.category_key] = [];
            map[opt.category_key].push(opt);
        }
        cache_util_1.cache.set(CACHE_KEY, map, CACHE_TTL_MS);
        return map;
    }
    // ── Mutations ─────────────────────────────────────────────────────────────────
    static async createOption(categoryKey, data) {
        this.assertValidCategory(categoryKey);
        const existing = await master_option_model_1.MasterOption.findOne({ category_key: categoryKey, value: data.value });
        if (existing)
            throw new app_error_util_1.AppError(`Option with value "${data.value}" already exists in category "${categoryKey}"`, 409);
        const maxOrder = await master_option_model_1.MasterOption.findOne({ category_key: categoryKey }).sort({ sort_order: -1 }).lean();
        const nextOrder = data.sort_order ?? ((maxOrder?.sort_order ?? -1) + 1);
        const opt = new master_option_model_1.MasterOption({
            option_id: (0, uuid_1.v4)(),
            category_key: categoryKey,
            label: data.label.trim(),
            value: data.value.trim().toLowerCase().replace(/\s+/g, '_'),
            sort_order: nextOrder,
            is_active: true,
            is_system: false,
            metadata: data.metadata ?? {},
        });
        const saved = await opt.save();
        cache_util_1.cache.delete(CACHE_KEY);
        return saved;
    }
    static async updateOption(optionId, data) {
        const opt = await master_option_model_1.MasterOption.findOne({ option_id: optionId });
        if (!opt)
            throw new app_error_util_1.AppError('Option not found', 404);
        if (data.label !== undefined)
            opt.label = data.label.trim();
        if (data.value !== undefined)
            opt.value = data.value.trim().toLowerCase().replace(/\s+/g, '_');
        if (data.sort_order !== undefined)
            opt.sort_order = data.sort_order;
        if (data.is_active !== undefined)
            opt.is_active = data.is_active;
        if (data.metadata !== undefined)
            opt.metadata = data.metadata;
        const saved = await opt.save();
        cache_util_1.cache.delete(CACHE_KEY);
        return saved;
    }
    static async deleteOption(optionId) {
        const opt = await master_option_model_1.MasterOption.findOne({ option_id: optionId });
        if (!opt)
            throw new app_error_util_1.AppError('Option not found', 404);
        if (opt.is_system)
            throw new app_error_util_1.AppError('System options cannot be deleted. Deactivate instead.', 400);
        await opt.deleteOne();
        cache_util_1.cache.delete(CACHE_KEY);
    }
    static async toggleActive(optionId) {
        const opt = await master_option_model_1.MasterOption.findOne({ option_id: optionId });
        if (!opt)
            throw new app_error_util_1.AppError('Option not found', 404);
        opt.is_active = !opt.is_active;
        const saved = await opt.save();
        cache_util_1.cache.delete(CACHE_KEY);
        return saved;
    }
    static async reorderOptions(categoryKey, orderedIds) {
        const updates = orderedIds.map((id, index) => master_option_model_1.MasterOption.updateOne({ option_id: id, category_key: categoryKey }, { $set: { sort_order: index } }));
        await Promise.all(updates);
        cache_util_1.cache.delete(CACHE_KEY);
    }
    // ── Seed ─────────────────────────────────────────────────────────────────────
    // One bulkWrite with upsert — 132 items in a single round-trip.
    // The unique (category_key, value) index causes duplicates to be silently skipped.
    static async seedDefaults() {
        const ops = [];
        let total = 0;
        for (const [categoryKey, items] of Object.entries(master_option_model_1.MASTER_SEED_DATA)) {
            items.forEach(({ label, value }, i) => {
                total++;
                ops.push({
                    updateOne: {
                        filter: { category_key: categoryKey, value },
                        update: {
                            $setOnInsert: {
                                option_id: (0, uuid_1.v4)(),
                                category_key: categoryKey,
                                label,
                                value,
                                sort_order: i,
                                is_active: true,
                                is_system: true,
                                metadata: {},
                            },
                        },
                        upsert: true,
                    },
                });
            });
        }
        if (ops.length === 0)
            return { created: 0, skipped: 0 };
        const result = await master_option_model_1.MasterOption.bulkWrite(ops, { ordered: false });
        cache_util_1.cache.delete(CACHE_KEY);
        const created = result.upsertedCount ?? 0;
        return { created, skipped: total - created };
    }
    // ── Toggle/Dropdown import mapping ────────────────────────────────────────────
    static normalizeBooleanImport(raw) {
        if (raw === null || raw === undefined || raw === '')
            return null;
        if (typeof raw === 'boolean')
            return raw;
        const str = String(raw).trim().toLowerCase();
        const TRUE_SET = new Set(['yes', 'available', 'standard', 'included', 'true', '1', 'yes (standard)', 'std', 'yes (optional)']);
        const FALSE_SET = new Set(['no', 'not available', 'optional', 'na', 'n/a', 'false', '0', 'not fitted', 'none', '-', '--']);
        if (TRUE_SET.has(str))
            return true;
        if (FALSE_SET.has(str))
            return false;
        return null;
    }
    static normalizeMultiSelectImport(raw) {
        if (!raw)
            return [];
        if (Array.isArray(raw))
            return raw.map((s) => String(s).trim()).filter(Boolean);
        return String(raw).split(/[,;/|]+/).map((s) => s.trim()).filter(Boolean);
    }
    // Resolves a raw imported value to the closest master option value.
    // Uses the shared 5-minute cache — a bulk import of N variants makes 1 DB round-trip
    // instead of N×categories queries.
    static async resolveDropdownImport(categoryKey, raw) {
        if (!raw)
            return '';
        const allOptions = await this.getAllActiveOptions();
        const options = allOptions[categoryKey] ?? [];
        const rawStr = String(raw).trim();
        const normalized = rawStr.toLowerCase().replace(/[\s-]+/g, '_');
        const exact = options.find((o) => o.value === normalized || o.label.toLowerCase() === rawStr.toLowerCase());
        if (exact)
            return exact.value;
        const partial = options.find((o) => o.label.toLowerCase().includes(rawStr.toLowerCase()));
        return partial ? partial.value : 'other';
    }
    // ── Unknown Value Queue ───────────────────────────────────────────────────────
    static async logUnknownValue(categoryKey, rawValue, context) {
        try {
            await unknown_value_model_1.UnknownValue.findOneAndUpdate({ category_key: categoryKey, raw_value: rawValue }, {
                $inc: { occurrence_count: 1 },
                $setOnInsert: {
                    unknown_id: (0, uuid_1.v4)(),
                    category_key: categoryKey,
                    raw_value: rawValue,
                    context: context ?? '',
                    is_resolved: false,
                },
            }, { upsert: true, new: true });
        }
        catch {
            // Non-fatal — never break imports due to logging failures
        }
    }
    static async getUnknownValues(resolvedFilter) {
        const filter = {};
        if (resolvedFilter !== undefined)
            filter.is_resolved = resolvedFilter;
        return unknown_value_model_1.UnknownValue.find(filter).sort({ occurrence_count: -1, created_at: -1 }).lean();
    }
    static async resolveUnknownValue(unknownId, targetOptionValue) {
        const record = await unknown_value_model_1.UnknownValue.findOne({ unknown_id: unknownId });
        if (!record)
            throw new app_error_util_1.AppError('Unknown value record not found', 404);
        record.is_resolved = true;
        record.resolved_to = targetOptionValue;
        record.resolved_at = new Date();
        return record.save();
    }
    static async dismissUnknownValue(unknownId) {
        const record = await unknown_value_model_1.UnknownValue.findOne({ unknown_id: unknownId });
        if (!record)
            throw new app_error_util_1.AppError('Unknown value record not found', 404);
        record.is_resolved = true;
        record.resolved_to = 'dismissed';
        record.resolved_at = new Date();
        await record.save();
    }
    static async promoteUnknownToMaster(unknownId) {
        const record = await unknown_value_model_1.UnknownValue.findOne({ unknown_id: unknownId });
        if (!record)
            throw new app_error_util_1.AppError('Unknown value record not found', 404);
        const label = record.raw_value;
        const value = label.trim().toLowerCase().replace(/[\s-]+/g, '_').replace(/[^a-z0-9_]/g, '');
        const created = await this.createOption(record.category_key, { label, value });
        record.is_resolved = true;
        record.resolved_to = created.value;
        record.resolved_at = new Date();
        await record.save();
        return created;
    }
    // Public label map: { category_key: { value: label, … }, … }
    static async getPublicLabelMap() {
        const allOptions = await this.getAllActiveOptions();
        const labelMap = {};
        for (const [categoryKey, options] of Object.entries(allOptions)) {
            labelMap[categoryKey] = {};
            for (const opt of options) {
                labelMap[categoryKey][opt.value] = opt.label;
            }
        }
        return labelMap;
    }
    // ── Private helpers ───────────────────────────────────────────────────────────
    static assertValidCategory(categoryKey) {
        const valid = master_option_model_1.MASTER_CATEGORIES.some((c) => c.key === categoryKey);
        if (!valid)
            throw new app_error_util_1.AppError(`Unknown master data category: "${categoryKey}"`, 400);
    }
}
exports.MasterDataService = MasterDataService;
//# sourceMappingURL=master-data.service.js.map