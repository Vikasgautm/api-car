"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommonModel = void 0;
const mssql_1 = __importDefault(require("mssql"));
const dbConnection_1 = require("../utils/dbConnection");
class CommonModel {
    tableName;
    primaryKey;
    jsonFields;
    constructor(tableName, primaryKey, jsonFields = []) {
        this.tableName = tableName;
        this.primaryKey = primaryKey;
        this.jsonFields = jsonFields;
    }
    getSqlType(value) {
        if (typeof value === 'string')
            return mssql_1.default.NVarChar();
        if (typeof value === 'number') {
            if (Number.isInteger(value))
                return mssql_1.default.Int();
            return mssql_1.default.Decimal();
        }
        if (typeof value === 'boolean')
            return mssql_1.default.Bit();
        if (value instanceof Date)
            return mssql_1.default.DateTime();
        return mssql_1.default.NVarChar();
    }
    prepareValue(value) {
        if (value === undefined || value === null)
            return null;
        if (typeof value === 'object' && !(value instanceof Date)) {
            return JSON.stringify(value);
        }
        return value;
    }
    serialize(data) {
        if (!data)
            return data;
        const serialized = { ...data };
        for (const field of this.jsonFields) {
            if (serialized[field] !== undefined && serialized[field] !== null) {
                if (typeof serialized[field] === 'object') {
                    serialized[field] = JSON.stringify(serialized[field]);
                }
            }
        }
        return serialized;
    }
    deserialize(row) {
        if (!row)
            return row;
        const deserialized = { ...row };
        for (const field of this.jsonFields) {
            if (deserialized[field] !== undefined && deserialized[field] !== null && typeof deserialized[field] === 'string') {
                try {
                    deserialized[field] = JSON.parse(deserialized[field]);
                }
                catch (e) {
                    // ignore and keep as string
                }
            }
        }
        return deserialized;
    }
    async insert(data, transaction) {
        const pool = await (0, dbConnection_1.getPool)();
        const request = transaction ? transaction.request() : pool.request();
        const serializedData = this.serialize(data);
        // Exclude 'id' field if it is null/undefined to let identity column auto-increment
        const keys = Object.keys(serializedData).filter(k => (k !== 'id' || serializedData[k] !== undefined) && typeof serializedData[k] !== 'function');
        const cols = keys.map(k => `[${k}]`).join(', ');
        const vals = keys.map(k => `@i_${k}`).join(', ');
        const query = `INSERT INTO [${this.tableName}] (${cols}) OUTPUT INSERTED.* VALUES (${vals})`;
        for (const key of keys) {
            const val = serializedData[key];
            request.input(`i_${key}`, this.getSqlType(val), this.prepareValue(val));
        }
        const result = await request.query(query);
        return this.deserialize(result.recordset[0]);
    }
    async bulkInsert(data, transaction) {
        const inserted = [];
        for (const item of data) {
            const record = await this.insert(item, transaction);
            inserted.push(record);
        }
        return inserted;
    }
    async update(whereClauseOrObj, data, params = [], transaction) {
        const pool = await (0, dbConnection_1.getPool)();
        const request = transaction ? transaction.request() : pool.request();
        const serializedData = this.serialize(data);
        let whereClause = '';
        const localParams = [];
        if (typeof whereClauseOrObj === 'string') {
            whereClause = whereClauseOrObj;
            localParams.push(...params);
        }
        else if (whereClauseOrObj && typeof whereClauseOrObj === 'object') {
            const clauses = [];
            let idx = 0;
            for (const [key, val] of Object.entries(whereClauseOrObj)) {
                const paramName = `w_${key}_${idx++}`;
                clauses.push(`[${key}] = @${paramName}`);
                localParams.push({ name: paramName, type: this.getSqlType(val), value: this.prepareValue(val) });
            }
            whereClause = clauses.join(' AND ');
        }
        const setClauses = [];
        const updateKeys = Object.keys(serializedData).filter(k => k !== 'id' && k !== this.primaryKey && typeof serializedData[k] !== 'function');
        for (const key of updateKeys) {
            setClauses.push(`[${key}] = @u_${key}`);
        }
        if (setClauses.length === 0)
            return 0;
        const query = `UPDATE [${this.tableName}] SET ${setClauses.join(', ')} ${whereClause ? `WHERE ${whereClause}` : ''}`;
        const addedParams = new Set();
        const register = (name, type, value) => {
            if (!addedParams.has(name)) {
                request.input(name, type, value);
                addedParams.add(name);
            }
        };
        // Register update values
        for (const key of updateKeys) {
            const val = serializedData[key];
            register(`u_${key}`, this.getSqlType(val), this.prepareValue(val));
        }
        // Register where params
        for (const p of localParams) {
            register(p.name, p.type, p.value);
        }
        const result = await request.query(query);
        return result.rowsAffected[0] || 0;
    }
    async delete(whereClauseOrObj, params = [], transaction) {
        const pool = await (0, dbConnection_1.getPool)();
        const request = transaction ? transaction.request() : pool.request();
        let whereClause = '';
        const localParams = [];
        if (typeof whereClauseOrObj === 'string') {
            whereClause = whereClauseOrObj;
            localParams.push(...params);
        }
        else if (whereClauseOrObj && typeof whereClauseOrObj === 'object') {
            const clauses = [];
            let idx = 0;
            for (const [key, val] of Object.entries(whereClauseOrObj)) {
                const paramName = `w_${key}_${idx++}`;
                clauses.push(`[${key}] = @${paramName}`);
                localParams.push({ name: paramName, type: this.getSqlType(val), value: this.prepareValue(val) });
            }
            whereClause = clauses.join(' AND ');
        }
        const query = `DELETE FROM [${this.tableName}] ${whereClause ? `WHERE ${whereClause}` : ''}`;
        for (const p of localParams) {
            request.input(p.name, p.type, p.value);
        }
        const result = await request.query(query);
        return result.rowsAffected[0] || 0;
    }
    async selectOne(whereClauseOrObj, params = [], transaction) {
        const pool = await (0, dbConnection_1.getPool)();
        const request = transaction ? transaction.request() : pool.request();
        let whereClause = '';
        const localParams = [];
        if (typeof whereClauseOrObj === 'string') {
            whereClause = whereClauseOrObj;
            localParams.push(...params);
        }
        else if (whereClauseOrObj && typeof whereClauseOrObj === 'object') {
            const clauses = [];
            let idx = 0;
            for (const [key, val] of Object.entries(whereClauseOrObj)) {
                const paramName = `w_${key}_${idx++}`;
                clauses.push(`[${key}] = @${paramName}`);
                localParams.push({ name: paramName, type: this.getSqlType(val), value: this.prepareValue(val) });
            }
            whereClause = clauses.join(' AND ');
        }
        const query = `SELECT TOP 1 * FROM [${this.tableName}] ${whereClause ? `WHERE ${whereClause}` : ''}`;
        for (const p of localParams) {
            request.input(p.name, p.type, p.value);
        }
        const result = await request.query(query);
        if (result.recordset.length === 0)
            return null;
        return this.deserialize(result.recordset[0]);
    }
    async selectMany(whereClauseOrObj, params = [], options, transaction) {
        const pool = await (0, dbConnection_1.getPool)();
        const request = transaction ? transaction.request() : pool.request();
        let whereClause = '';
        const localParams = [];
        if (typeof whereClauseOrObj === 'string') {
            whereClause = whereClauseOrObj;
            localParams.push(...params);
        }
        else if (whereClauseOrObj && typeof whereClauseOrObj === 'object') {
            const clauses = [];
            let idx = 0;
            for (const [key, val] of Object.entries(whereClauseOrObj)) {
                const paramName = `w_${key}_${idx++}`;
                clauses.push(`[${key}] = @${paramName}`);
                localParams.push({ name: paramName, type: this.getSqlType(val), value: this.prepareValue(val) });
            }
            whereClause = clauses.join(' AND ');
        }
        let selectCols = '*';
        if (options?.select && Array.isArray(options.select) && options.select.length > 0) {
            selectCols = options.select.map(col => `[${col}]`).join(', ');
        }
        const orderByCol = options?.orderBy ? `[${options.orderBy}]` : `[${this.primaryKey}]`;
        const orderDir = options?.orderDirection === 'DESC' ? 'DESC' : 'ASC';
        const orderByClause = `ORDER BY ${orderByCol} ${orderDir}`;
        let query = '';
        if (options?.skip !== undefined || options?.limit !== undefined) {
            const offset = options.skip !== undefined ? options.skip : 0;
            const fetch = options.limit !== undefined ? options.limit : 1000000;
            query = `SELECT ${selectCols} FROM [${this.tableName}] ${whereClause ? `WHERE ${whereClause}` : ''} ${orderByClause} OFFSET ${offset} ROWS FETCH NEXT ${fetch} ROWS ONLY`;
        }
        else {
            query = `SELECT ${selectCols} FROM [${this.tableName}] ${whereClause ? `WHERE ${whereClause}` : ''} ${orderByClause}`;
        }
        for (const p of localParams) {
            request.input(p.name, p.type, p.value);
        }
        const result = await request.query(query);
        return result.recordset.map(row => this.deserialize(row));
    }
    async exists(whereClauseOrObj, params = [], transaction) {
        const pool = await (0, dbConnection_1.getPool)();
        const request = transaction ? transaction.request() : pool.request();
        let whereClause = '';
        const localParams = [];
        if (typeof whereClauseOrObj === 'string') {
            whereClause = whereClauseOrObj;
            localParams.push(...params);
        }
        else if (whereClauseOrObj && typeof whereClauseOrObj === 'object') {
            const clauses = [];
            let idx = 0;
            for (const [key, val] of Object.entries(whereClauseOrObj)) {
                const paramName = `w_${key}_${idx++}`;
                clauses.push(`[${key}] = @${paramName}`);
                localParams.push({ name: paramName, type: this.getSqlType(val), value: this.prepareValue(val) });
            }
            whereClause = clauses.join(' AND ');
        }
        const query = `SELECT TOP 1 1 as [exists] FROM [${this.tableName}] ${whereClause ? `WHERE ${whereClause}` : ''}`;
        for (const p of localParams) {
            request.input(p.name, p.type, p.value);
        }
        const result = await request.query(query);
        return result.recordset.length > 0;
    }
    async count(whereClauseOrObj, params = [], transaction) {
        const pool = await (0, dbConnection_1.getPool)();
        const request = transaction ? transaction.request() : pool.request();
        let whereClause = '';
        const localParams = [];
        if (typeof whereClauseOrObj === 'string') {
            whereClause = whereClauseOrObj;
            localParams.push(...params);
        }
        else if (whereClauseOrObj && typeof whereClauseOrObj === 'object') {
            const clauses = [];
            let idx = 0;
            for (const [key, val] of Object.entries(whereClauseOrObj)) {
                const paramName = `w_${key}_${idx++}`;
                clauses.push(`[${key}] = @${paramName}`);
                localParams.push({ name: paramName, type: this.getSqlType(val), value: this.prepareValue(val) });
            }
            whereClause = clauses.join(' AND ');
        }
        const query = `SELECT COUNT(*) as [count] FROM [${this.tableName}] ${whereClause ? `WHERE ${whereClause}` : ''}`;
        for (const p of localParams) {
            request.input(p.name, p.type, p.value);
        }
        const result = await request.query(query);
        return result.recordset[0]?.count || 0;
    }
}
exports.CommonModel = CommonModel;
//# sourceMappingURL=CommonModel.js.map