"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MasterDataService = void 0;
const uuid_1 = require("uuid");
const master_option_model_1 = require("../models/master-option.model");
const app_error_util_1 = require("../../../shared/utils/app-error.util");
const cache_util_1 = require("../../../utils/cache.util");
const dbConnection_1 = require("../../../sql/utils/dbConnection");
const CACHE_KEY = 'master_data:all_active';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
function safeParseJson(value) {
    if (value === null || value === undefined)
        return {};
    if (typeof value === 'object')
        return value;
    if (typeof value === 'string') {
        try {
            return value.trim() ? JSON.parse(value) : {};
        }
        catch {
            return {};
        }
    }
    return {};
}
class MasterDataService {
    // ── Query ────────────────────────────────────────────────────────────────────
    static async getCategories() {
        return master_option_model_1.MASTER_CATEGORIES;
    }
    static async getOptions(categoryKey, includeInactive = false) {
        const pool = await (0, dbConnection_1.getPool)();
        let query = 'SELECT * FROM MasterOptions WHERE category_key = @cat';
        if (!includeInactive) {
            query += ' AND is_active = 1';
        }
        query += ' ORDER BY sort_order ASC, label ASC';
        const result = await pool.request()
            .input('cat', dbConnection_1.mssql.NVarChar, categoryKey)
            .query(query);
        return result.recordset.map(row => ({
            ...row,
            is_active: row.is_active === true || row.is_active === 1,
            is_system: row.is_system === true || row.is_system === 1,
            metadata: safeParseJson(row.metadata),
        }));
    }
    static async getOptionByValue(categoryKey, value) {
        const pool = await (0, dbConnection_1.getPool)();
        const result = await pool.request()
            .input('cat', dbConnection_1.mssql.NVarChar, categoryKey)
            .input('val', dbConnection_1.mssql.NVarChar, value)
            .query('SELECT * FROM MasterOptions WHERE category_key = @cat AND value = @val LIMIT 1');
        if (result.recordset.length === 0)
            return null;
        const row = result.recordset[0];
        return {
            ...row,
            is_active: row.is_active === true || row.is_active === 1,
            is_system: row.is_system === true || row.is_system === 1,
            metadata: safeParseJson(row.metadata),
        };
    }
    static async getAllActiveOptions() {
        const cached = cache_util_1.cache.get(CACHE_KEY);
        if (cached)
            return cached;
        const pool = await (0, dbConnection_1.getPool)();
        const query = `
    SELECT *
    FROM MasterOptions
    WHERE is_active = 1
    ORDER BY category_key ASC, sort_order ASC
  `;
        const result = await pool.request().query(query);
        const map = {};
        for (const row of result.recordset) {
            let metadata = {};
            try {
                if (typeof row.metadata === "string") {
                    metadata = row.metadata.trim()
                        ? JSON.parse(row.metadata)
                        : {};
                }
                else if (row.metadata &&
                    typeof row.metadata === "object") {
                    metadata = row.metadata;
                }
            }
            catch (error) {
                console.error(`Invalid metadata JSON for option_id ${row.option_id}:`, row.metadata);
                metadata = {};
            }
            const opt = {
                ...row,
                is_active: row.is_active === true || row.is_active === 1,
                is_system: row.is_system === true || row.is_system === 1,
                metadata,
            };
            if (!map[opt.category_key]) {
                map[opt.category_key] = [];
            }
            map[opt.category_key].push(opt);
        }
        cache_util_1.cache.set(CACHE_KEY, map, CACHE_TTL_MS);
        return map;
    }
    // ── Mutations ─────────────────────────────────────────────────────────────────
    static async createOption(categoryKey, data) {
        this.assertValidCategory(categoryKey);
        const pool = await (0, dbConnection_1.getPool)();
        const existing = await pool.request()
            .input('cat', dbConnection_1.mssql.NVarChar, categoryKey)
            .input('val', dbConnection_1.mssql.NVarChar, data.value)
            .query('SELECT 1 FROM MasterOptions WHERE category_key = @cat AND value = @val');
        if (existing.recordset.length > 0) {
            throw new app_error_util_1.AppError(`Option with value "${data.value}" already exists in category "${categoryKey}"`, 409);
        }
        const maxOrderResult = await pool.request()
            .input('cat', dbConnection_1.mssql.NVarChar, categoryKey)
            .query('SELECT MAX(sort_order) as max_order FROM MasterOptions WHERE category_key = @cat');
        const maxOrder = maxOrderResult.recordset[0]?.max_order;
        const nextOrder = data.sort_order ?? ((maxOrder !== null && maxOrder !== undefined ? maxOrder : -1) + 1);
        const option_id = (0, uuid_1.v4)();
        const label = data.label.trim();
        const value = data.value.trim().toLowerCase().replace(/\s+/g, '_');
        const metadata = data.metadata ? JSON.stringify(data.metadata) : '{}';
        await pool.request()
            .input('oid', dbConnection_1.mssql.NVarChar, option_id)
            .input('cat', dbConnection_1.mssql.NVarChar, categoryKey)
            .input('lbl', dbConnection_1.mssql.NVarChar, label)
            .input('val', dbConnection_1.mssql.NVarChar, value)
            .input('ord', dbConnection_1.mssql.Int, nextOrder)
            .input('meta', dbConnection_1.mssql.NVarChar, metadata)
            .query('INSERT INTO MasterOptions (option_id, category_key, label, value, sort_order, is_active, is_system, metadata, createdAt, updatedAt) VALUES (@oid, @cat, @lbl, @val, @ord, 1, 0, @meta, NOW(), NOW())');
        cache_util_1.cache.delete(CACHE_KEY);
        return {
            option_id,
            category_key: categoryKey,
            label,
            value,
            sort_order: nextOrder,
            is_active: true,
            is_system: false,
            metadata: data.metadata ?? {},
            created_at: new Date(),
            updated_at: new Date(),
        };
    }
    static async updateOption(optionId, data) {
        const pool = await (0, dbConnection_1.getPool)();
        const existingResult = await pool.request()
            .input('oid', dbConnection_1.mssql.NVarChar, optionId)
            .query('SELECT * FROM MasterOptions WHERE option_id = @oid LIMIT 1');
        if (existingResult.recordset.length === 0)
            throw new app_error_util_1.AppError('Option not found', 404);
        const opt = existingResult.recordset[0];
        const label = data.label !== undefined ? data.label.trim() : opt.label;
        const value = data.value !== undefined ? data.value.trim().toLowerCase().replace(/\s+/g, '_') : opt.value;
        const sort_order = data.sort_order !== undefined ? data.sort_order : opt.sort_order;
        const is_active = data.is_active !== undefined ? (data.is_active ? 1 : 0) : opt.is_active;
        const metadata = data.metadata !== undefined ? JSON.stringify(data.metadata) : opt.metadata;
        await pool.request()
            .input('oid', dbConnection_1.mssql.NVarChar, optionId)
            .input('lbl', dbConnection_1.mssql.NVarChar, label)
            .input('val', dbConnection_1.mssql.NVarChar, value)
            .input('ord', dbConnection_1.mssql.Int, sort_order)
            .input('act', dbConnection_1.mssql.Bit, is_active)
            .input('meta', dbConnection_1.mssql.NVarChar, metadata)
            .query('UPDATE MasterOptions SET label = @lbl, value = @val, sort_order = @ord, is_active = @act, metadata = @meta, updatedAt = NOW() WHERE option_id = @oid');
        cache_util_1.cache.delete(CACHE_KEY);
        return {
            option_id: optionId,
            category_key: opt.category_key,
            label,
            value,
            sort_order,
            is_active: is_active === 1 || is_active === true,
            is_system: opt.is_system === 1 || opt.is_system === true,
            metadata: data.metadata !== undefined ? data.metadata : safeParseJson(opt.metadata),
            created_at: opt.createdAt,
            updated_at: new Date(),
        };
    }
    static async deleteOption(optionId) {
        const pool = await (0, dbConnection_1.getPool)();
        const existingResult = await pool.request()
            .input('oid', dbConnection_1.mssql.NVarChar, optionId)
            .query('SELECT is_system FROM MasterOptions WHERE option_id = @oid LIMIT 1');
        if (existingResult.recordset.length === 0)
            throw new app_error_util_1.AppError('Option not found', 404);
        if (existingResult.recordset[0].is_system === 1 || existingResult.recordset[0].is_system === true) {
            throw new app_error_util_1.AppError('System options cannot be deleted. Deactivate instead.', 400);
        }
        await pool.request()
            .input('oid', dbConnection_1.mssql.NVarChar, optionId)
            .query('DELETE FROM MasterOptions WHERE option_id = @oid');
        cache_util_1.cache.delete(CACHE_KEY);
    }
    static async toggleActive(optionId) {
        const pool = await (0, dbConnection_1.getPool)();
        const existingResult = await pool.request()
            .input('oid', dbConnection_1.mssql.NVarChar, optionId)
            .query('SELECT * FROM MasterOptions WHERE option_id = @oid LIMIT 1');
        if (existingResult.recordset.length === 0)
            throw new app_error_util_1.AppError('Option not found', 404);
        const opt = existingResult.recordset[0];
        const newActive = opt.is_active === 1 || opt.is_active === true ? 0 : 1;
        await pool.request()
            .input('oid', dbConnection_1.mssql.NVarChar, optionId)
            .input('act', dbConnection_1.mssql.Bit, newActive)
            .query('UPDATE MasterOptions SET is_active = @act, updatedAt = NOW() WHERE option_id = @oid');
        cache_util_1.cache.delete(CACHE_KEY);
        return {
            ...opt,
            is_active: newActive === 1,
            is_system: opt.is_system === 1 || opt.is_system === true,
            metadata: safeParseJson(opt.metadata),
            created_at: opt.createdAt,
            updated_at: new Date(),
        };
    }
    static async reorderOptions(categoryKey, orderedIds) {
        const pool = await (0, dbConnection_1.getPool)();
        const transaction = new dbConnection_1.mssql.Transaction(pool);
        await transaction.begin();
        try {
            for (let i = 0; i < orderedIds.length; i++) {
                await transaction.request()
                    .input('oid', dbConnection_1.mssql.NVarChar, orderedIds[i])
                    .input('cat', dbConnection_1.mssql.NVarChar, categoryKey)
                    .input('ord', dbConnection_1.mssql.Int, i)
                    .query('UPDATE MasterOptions SET sort_order = @ord, updatedAt = NOW() WHERE option_id = @oid AND category_key = @cat');
            }
            await transaction.commit();
        }
        catch (err) {
            await transaction.rollback();
            throw err;
        }
        cache_util_1.cache.delete(CACHE_KEY);
    }
    // ── Seed ─────────────────────────────────────────────────────────────────────
    static async seedDefaults() {
        const pool = await (0, dbConnection_1.getPool)();
        let created = 0;
        let total = 0;
        for (const [categoryKey, items] of Object.entries(master_option_model_1.MASTER_SEED_DATA)) {
            for (let i = 0; i < items.length; i++) {
                const { label, value } = items[i];
                total++;
                const check = await pool.request()
                    .input('cat', dbConnection_1.mssql.NVarChar, categoryKey)
                    .input('val', dbConnection_1.mssql.NVarChar, value)
                    .query('SELECT 1 FROM MasterOptions WHERE category_key = @cat AND value = @val');
                if (check.recordset.length === 0) {
                    await pool.request()
                        .input('oid', dbConnection_1.mssql.NVarChar, (0, uuid_1.v4)())
                        .input('cat', dbConnection_1.mssql.NVarChar, categoryKey)
                        .input('lbl', dbConnection_1.mssql.NVarChar, label)
                        .input('val', dbConnection_1.mssql.NVarChar, value)
                        .input('ord', dbConnection_1.mssql.Int, i)
                        .query('INSERT INTO MasterOptions (option_id, category_key, label, value, sort_order, is_active, is_system, metadata, createdAt, updatedAt) VALUES (@oid, @cat, @lbl, @val, @ord, 1, 1, \'{}\', NOW(), NOW())');
                    created++;
                }
            }
        }
        cache_util_1.cache.delete(CACHE_KEY);
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
            const pool = await (0, dbConnection_1.getPool)();
            const check = await pool.request()
                .input('cat', dbConnection_1.mssql.NVarChar, categoryKey)
                .input('val', dbConnection_1.mssql.NVarChar, rawValue)
                .query('SELECT unknown_id FROM UnknownValues WHERE category_key = @cat AND raw_value = @val');
            if (check.recordset.length > 0) {
                const record = check.recordset[0];
                await pool.request()
                    .input('uid', dbConnection_1.mssql.NVarChar, record.unknown_id)
                    .query('UPDATE UnknownValues SET occurrence_count = occurrence_count + 1, updatedAt = NOW() WHERE unknown_id = @uid');
            }
            else {
                await pool.request()
                    .input('uid', dbConnection_1.mssql.NVarChar, (0, uuid_1.v4)())
                    .input('cat', dbConnection_1.mssql.NVarChar, categoryKey)
                    .input('val', dbConnection_1.mssql.NVarChar, rawValue)
                    .input('ctx', dbConnection_1.mssql.NVarChar, context ?? '')
                    .query('INSERT INTO UnknownValues (unknown_id, category_key, raw_value, context, occurrence_count, is_resolved, createdAt, updatedAt) VALUES (@uid, @cat, @val, @ctx, 1, 0, NOW(), NOW())');
            }
        }
        catch {
            // Non-fatal — never break imports due to logging failures
        }
    }
    static async getUnknownValues(resolvedFilter) {
        const pool = await (0, dbConnection_1.getPool)();
        let query = 'SELECT * FROM UnknownValues';
        const request = pool.request();
        if (resolvedFilter !== undefined) {
            query += ' WHERE is_resolved = @res';
            request.input('res', dbConnection_1.mssql.Bit, resolvedFilter ? 1 : 0);
        }
        query += ' ORDER BY occurrence_count DESC, createdAt DESC';
        const result = await request.query(query);
        return result.recordset.map(row => ({
            ...row,
            is_resolved: row.is_resolved === true || row.is_resolved === 1,
        }));
    }
    static async resolveUnknownValue(unknownId, targetOptionValue) {
        const pool = await (0, dbConnection_1.getPool)();
        const existing = await pool.request()
            .input('uid', dbConnection_1.mssql.NVarChar, unknownId)
            .query('SELECT * FROM UnknownValues WHERE unknown_id = @uid LIMIT 1');
        if (existing.recordset.length === 0)
            throw new app_error_util_1.AppError('Unknown value record not found', 404);
        await pool.request()
            .input('uid', dbConnection_1.mssql.NVarChar, unknownId)
            .input('to', dbConnection_1.mssql.NVarChar, targetOptionValue)
            .query('UPDATE UnknownValues SET is_resolved = 1, resolved_to = @to, resolved_at = NOW(), updatedAt = NOW() WHERE unknown_id = @uid');
        return {
            ...existing.recordset[0],
            is_resolved: true,
            resolved_to: targetOptionValue,
            resolved_at: new Date(),
            updated_at: new Date(),
        };
    }
    static async dismissUnknownValue(unknownId) {
        const pool = await (0, dbConnection_1.getPool)();
        const check = await pool.request()
            .input('uid', dbConnection_1.mssql.NVarChar, unknownId)
            .query('SELECT 1 FROM UnknownValues WHERE unknown_id = @uid');
        if (check.recordset.length === 0)
            throw new app_error_util_1.AppError('Unknown value record not found', 404);
        await pool.request()
            .input('uid', dbConnection_1.mssql.NVarChar, unknownId)
            .query('UPDATE UnknownValues SET is_resolved = 1, resolved_to = \'dismissed\', resolved_at = NOW(), updatedAt = NOW() WHERE unknown_id = @uid');
    }
    static async promoteUnknownToMaster(unknownId) {
        const pool = await (0, dbConnection_1.getPool)();
        const existing = await pool.request()
            .input('uid', dbConnection_1.mssql.NVarChar, unknownId)
            .query('SELECT * FROM UnknownValues WHERE unknown_id = @uid LIMIT 1');
        if (existing.recordset.length === 0)
            throw new app_error_util_1.AppError('Unknown value record not found', 404);
        const record = existing.recordset[0];
        const label = record.raw_value;
        const value = label.trim().toLowerCase().replace(/[\s-]+/g, '_').replace(/[^a-z0-9_]/g, '');
        const created = await this.createOption(record.category_key, { label, value });
        await pool.request()
            .input('uid', unknownId)
            .input('to', created.value)
            .query('UPDATE UnknownValues SET is_resolved = 1, resolved_to = @to, resolved_at = NOW(), updatedAt = NOW() WHERE unknown_id = @uid');
        return created;
    }
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
    static assertValidCategory(categoryKey) {
        const valid = master_option_model_1.MASTER_CATEGORIES.some((c) => c.key === categoryKey);
        if (!valid)
            throw new app_error_util_1.AppError(`Unknown master data category: "${categoryKey}"`, 400);
    }
}
exports.MasterDataService = MasterDataService;
