"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mssql = void 0;
exports.getPool = getPool;
exports.executeQuery = executeQuery;
exports.executeQueryParams = executeQueryParams;
const promise_1 = __importDefault(require("mysql2/promise"));
const db_config_1 = require("../config/db.config");
let rawPool = null;
let mssqlPool = null;
function translateQuery(query, paramsMap) {
    // 1. Replace square brackets with backticks for column/table identifiers (ignoring numeric JSON array indices like $[0])
    let sql = query.replace(/(?<!\$)\[([a-zA-Z_0-9\.]+)\]/g, (match, p1) => {
        if (/^\d+$/.test(p1))
            return match;
        return `\`${p1.replace(/\./g, '`.`')}\``;
    });
    // 2. Replace GETDATE() with NOW()
    sql = sql.replace(/GETDATE\(\)/gi, 'NOW()');
    // 3. Replace ISNULL with COALESCE
    sql = sql.replace(/ISNULL\(/gi, 'COALESCE(');
    // 4. Replace JSON_VALUE(col, '$.path') with JSON_UNQUOTE(JSON_EXTRACT(col, '$.path'))
    sql = sql.replace(/JSON_VALUE\(([^,]+),\s*'([^']+)'\)/gi, "JSON_UNQUOTE(JSON_EXTRACT($1, '$2'))");
    // 5. Replace SELECT TOP N with LIMIT
    const topMatch = sql.match(/SELECT\s+TOP\s*\(?(\d+)\)?\s+/i);
    if (topMatch) {
        const limitVal = topMatch[1];
        sql = sql.replace(/SELECT\s+TOP\s*\(?\d+\)?\s+/i, 'SELECT ');
        if (!/LIMIT\s+\d+/i.test(sql)) {
            sql += ` LIMIT ${limitVal}`;
        }
    }
    // 5b. Replace MSSQL OFFSET x ROWS FETCH NEXT y ROWS ONLY with MySQL LIMIT y OFFSET x
    sql = sql.replace(/OFFSET\s+([@a-zA-Z0-9_?]+|\d+)\s+ROWS\s+FETCH\s+NEXT\s+([@a-zA-Z0-9_?]+|\d+)\s+ROWS\s+ONLY/gi, 'LIMIT $2 OFFSET $1');
    // 6. Replace OUTPUT INSERTED.*
    sql = sql.replace(/OUTPUT\s+INSERTED\.\*/gi, '');
    // 7. Named parameter mappings: find all @paramName and replace with ?
    const values = [];
    const paramRegex = /@([a-zA-Z0-9_]+)/g;
    sql = sql.replace(paramRegex, (match, paramName) => {
        if (paramsMap && paramName in paramsMap) {
            const val = paramsMap[paramName];
            values.push(val !== undefined ? val : null);
            return '?';
        }
        return match;
    });
    return { sql, values };
}
class MySqlRequest {
    paramsMap = {};
    connectionOrPool;
    constructor(connectionOrPool) {
        this.connectionOrPool = connectionOrPool;
    }
    input(name, typeOrValue, value) {
        if (value === undefined) {
            this.paramsMap[name] = typeOrValue;
        }
        else {
            this.paramsMap[name] = value;
        }
        return this;
    }
    async query(queryString) {
        const { sql, values } = translateQuery(queryString, this.paramsMap);
        let rows;
        let fields;
        if (this.connectionOrPool.execute) {
            [rows, fields] = await this.connectionOrPool.execute(sql, values);
        }
        else {
            [rows, fields] = await this.connectionOrPool.query(sql, values);
        }
        let recordset = [];
        let affectedRows = 0;
        if (Array.isArray(rows)) {
            recordset = rows;
        }
        else if (rows && typeof rows === 'object') {
            affectedRows = rows.affectedRows || 0;
            // Handle transparent auto-retrieval for INSERT OUTPUT INSERTED.*
            if (queryString.toUpperCase().includes('INSERT INTO') &&
                queryString.toUpperCase().includes('OUTPUT INSERTED.*')) {
                const tableMatch = queryString.match(/INSERT\s+INTO\s+([`\[a-zA-Z0-9_\]`]+)/i);
                if (tableMatch) {
                    const tableName = tableMatch[1].replace(/[`\[\]]/g, '');
                    const insertId = rows.insertId;
                    let idColName = null;
                    let idValue = null;
                    for (const key of Object.keys(this.paramsMap)) {
                        if (key.startsWith('i_') && key.endsWith('_id')) {
                            idColName = key.substring(2);
                            idValue = this.paramsMap[key];
                            break;
                        }
                    }
                    let selectSql = '';
                    let selectParams = [];
                    if (idColName && idValue !== undefined) {
                        selectSql = `SELECT * FROM \`${tableName}\` WHERE \`${idColName}\` = ?`;
                        selectParams = [idValue];
                    }
                    else if (insertId) {
                        selectSql = `SELECT * FROM \`${tableName}\` WHERE \`id\` = ?`;
                        selectParams = [insertId];
                    }
                    if (selectSql) {
                        let selectRows;
                        if (this.connectionOrPool.execute) {
                            [selectRows] = await this.connectionOrPool.execute(selectSql, selectParams);
                        }
                        else {
                            [selectRows] = await this.connectionOrPool.query(selectSql, selectParams);
                        }
                        if (Array.isArray(selectRows) && selectRows.length > 0) {
                            recordset = selectRows;
                        }
                    }
                }
            }
        }
        return {
            recordset,
            recordsets: [recordset],
            rowsAffected: [affectedRows],
        };
    }
}
class MySqlTransaction {
    pool;
    connection = null;
    constructor(pool) {
        this.pool = pool;
    }
    async begin() {
        const raw = this.pool.pool || this.pool;
        this.connection = await raw.getConnection();
        await this.connection.beginTransaction();
    }
    request() {
        if (!this.connection) {
            throw new Error('Transaction has not started. Call begin() first.');
        }
        return new MySqlRequest(this.connection);
    }
    async commit() {
        if (!this.connection) {
            throw new Error('Transaction has not started or already closed.');
        }
        try {
            await this.connection.commit();
        }
        finally {
            this.connection.release();
            this.connection = null;
        }
    }
    async rollback() {
        if (!this.connection) {
            throw new Error('Transaction has not started or already closed.');
        }
        try {
            await this.connection.rollback();
        }
        finally {
            this.connection.release();
            this.connection = null;
        }
    }
}
class MySqlConnectionPool {
    pool;
    constructor(pool) {
        this.pool = pool;
    }
    request() {
        return new MySqlRequest(this.pool);
    }
    async connect() {
        return this;
    }
    async close() {
        await this.pool.end();
    }
}
exports.mssql = {
    ConnectionPool: MySqlConnectionPool,
    Request: MySqlRequest,
    Transaction: MySqlTransaction,
    NVarChar: () => 'NVarChar',
    Int: () => 'Int',
    Decimal: () => 'Decimal',
    Bit: () => 'Bit',
    DateTime: () => 'DateTime',
    VarChar: () => 'VarChar',
    Text: () => 'Text',
};
async function getPool() {
    if (mssqlPool) {
        return mssqlPool;
    }
    try {
        rawPool = promise_1.default.createPool(db_config_1.sqlConfig);
        mssqlPool = new MySqlConnectionPool(rawPool);
        console.log('Connected to MySQL successfully');
        return mssqlPool;
    }
    catch (error) {
        console.error('MySQL connection pool creation failed: ', error);
        rawPool = null;
        mssqlPool = null;
        throw error;
    }
}
async function executeQuery(query) {
    const connectionPool = await getPool();
    return connectionPool.request().query(query);
}
async function executeQueryParams(query, params) {
    const connectionPool = await getPool();
    const request = connectionPool.request();
    for (const param of params) {
        request.input(param.name, param.type, param.value);
    }
    return request.query(query);
}
