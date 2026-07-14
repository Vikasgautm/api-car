"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongooseAdapter = exports.MongooseQuery = void 0;
exports.getSqlTransaction = getSqlTransaction;
exports.compileFilter = compileFilter;
exports.createDocumentWrapper = createDocumentWrapper;
const mongoose_1 = __importDefault(require("mongoose"));
const mssql_1 = __importDefault(require("mssql"));
const dbConnection_1 = require("../utils/dbConnection");
// Intercept Mongoose startSession to support SQL transactions
const originalStartSession = mongoose_1.default.startSession;
mongoose_1.default.startSession = async function (options) {
    const session = await originalStartSession.call(mongoose_1.default, options);
    // Patch startTransaction
    const originalStartTransaction = session.startTransaction;
    session.startTransaction = function (opts) {
        originalStartTransaction.call(session, opts);
        const poolPromise = (0, dbConnection_1.getPool)();
        const sqlTxPromise = poolPromise.then(async (pool) => {
            const transaction = new mssql_1.default.Transaction(pool);
            await transaction.begin();
            return transaction;
        });
        session.__sql_tx_promise = sqlTxPromise;
    };
    // Patch commitTransaction
    const originalCommitTransaction = session.commitTransaction;
    session.commitTransaction = async function () {
        await originalCommitTransaction.call(session);
        const txPromise = session.__sql_tx_promise;
        if (txPromise) {
            const transaction = await txPromise;
            await transaction.commit();
            session.__sql_tx_promise = null;
        }
    };
    // Patch abortTransaction
    const originalAbortTransaction = session.abortTransaction;
    session.abortTransaction = async function () {
        await originalAbortTransaction.call(session);
        const txPromise = session.__sql_tx_promise;
        if (txPromise) {
            const transaction = await txPromise;
            await transaction.rollback();
            session.__sql_tx_promise = null;
        }
    };
    return session;
};
async function getSqlTransaction(session) {
    if (!session)
        return undefined;
    const txPromise = session.__sql_tx_promise;
    if (txPromise) {
        return await txPromise;
    }
    return undefined;
}
function getSqlType(value) {
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
function prepareValue(value) {
    if (value === undefined || value === null)
        return null;
    if (typeof value === 'object' && !(value instanceof Date)) {
        return JSON.stringify(value);
    }
    return value;
}
function compileFilter(filter, prefix = 'f') {
    if (!filter || Object.keys(filter).length === 0) {
        return { whereClause: '', params: [] };
    }
    const clauses = [];
    const params = [];
    let paramCounter = 0;
    for (const [key, val] of Object.entries(filter)) {
        if (key === '$or' && Array.isArray(val)) {
            const orClauses = [];
            val.forEach((subFilter, index) => {
                const sub = compileFilter(subFilter, `${prefix}_or${index}`);
                if (sub.whereClause) {
                    orClauses.push(`(${sub.whereClause})`);
                    params.push(...sub.params);
                }
            });
            if (orClauses.length > 0) {
                clauses.push(`(${orClauses.join(' OR ')})`);
            }
            continue;
        }
        if (key === '$and' && Array.isArray(val)) {
            const andClauses = [];
            val.forEach((subFilter, index) => {
                const sub = compileFilter(subFilter, `${prefix}_and${index}`);
                if (sub.whereClause) {
                    andClauses.push(`(${sub.whereClause})`);
                    params.push(...sub.params);
                }
            });
            if (andClauses.length > 0) {
                clauses.push(`(${andClauses.join(' AND ')})`);
            }
            continue;
        }
        const paramName = `${prefix}_${key}_${paramCounter++}`;
        if (val && typeof val === 'object' && !(val instanceof Date) && !Array.isArray(val)) {
            const ops = Object.keys(val);
            for (const op of ops) {
                const opVal = val[op];
                if (op === '$ne') {
                    clauses.push(`([${key}] IS NULL OR [${key}] <> @${paramName})`);
                    params.push({ name: paramName, type: getSqlType(opVal), value: prepareValue(opVal) });
                }
                else if (op === '$in' && Array.isArray(opVal)) {
                    if (opVal.length === 0) {
                        clauses.push('1 = 0');
                    }
                    else {
                        const inParamNames = opVal.map((_, i) => `@${paramName}_in${i}`);
                        clauses.push(`[${key}] IN (${inParamNames.join(', ')})`);
                        opVal.forEach((v, i) => {
                            params.push({ name: `${paramName}_in${i}`, type: getSqlType(v), value: prepareValue(v) });
                        });
                    }
                }
                else if (op === '$nin' && Array.isArray(opVal)) {
                    if (opVal.length > 0) {
                        const ninParamNames = opVal.map((_, i) => `@${paramName}_nin${i}`);
                        clauses.push(`([${key}] IS NULL OR [${key}] NOT IN (${ninParamNames.join(', ')}))`);
                        opVal.forEach((v, i) => {
                            params.push({ name: `${paramName}_nin${i}`, type: getSqlType(v), value: prepareValue(v) });
                        });
                    }
                }
                else if (op === '$regex') {
                    clauses.push(`[${key}] LIKE @${paramName}`);
                    let regexStr = typeof opVal === 'string' ? opVal : (opVal.source || '');
                    regexStr = regexStr.replace(/^\^/, '').replace(/\$$/, '');
                    params.push({ name: paramName, type: mssql_1.default.NVarChar(), value: `%${regexStr}%` });
                }
                else if (op === '$gt') {
                    clauses.push(`[${key}] > @${paramName}`);
                    params.push({ name: paramName, type: getSqlType(opVal), value: prepareValue(opVal) });
                }
                else if (op === '$gte') {
                    clauses.push(`[${key}] >= @${paramName}`);
                    params.push({ name: paramName, type: getSqlType(opVal), value: prepareValue(opVal) });
                }
                else if (op === '$lt') {
                    clauses.push(`[${key}] < @${paramName}`);
                    params.push({ name: paramName, type: getSqlType(opVal), value: prepareValue(opVal) });
                }
                else if (op === '$lte') {
                    clauses.push(`[${key}] <= @${paramName}`);
                    params.push({ name: paramName, type: getSqlType(opVal), value: prepareValue(opVal) });
                }
            }
        }
        else {
            if (val === null) {
                clauses.push(`[${key}] IS NULL`);
            }
            else {
                clauses.push(`[${key}] = @${paramName}`);
                params.push({ name: paramName, type: getSqlType(val), value: prepareValue(val) });
            }
        }
    }
    return {
        whereClause: clauses.join(' AND '),
        params,
    };
}
function createDocumentWrapper(model, data, pkName) {
    if (!data)
        return data;
    const doc = { ...data };
    Object.defineProperty(doc, 'save', {
        enumerable: false,
        value: async function (options) {
            const session = options?.session;
            const transaction = session ? await getSqlTransaction(session) : undefined;
            const pkValue = doc[pkName];
            if (pkValue !== undefined && pkValue !== null) {
                const updateData = {};
                for (const [k, v] of Object.entries(doc)) {
                    if (k !== pkName && typeof v !== 'function') {
                        updateData[k] = v;
                    }
                }
                await model.update({ [pkName]: pkValue }, updateData, [], transaction);
            }
            else {
                const inserted = await model.insert(doc, transaction);
                Object.assign(doc, inserted);
            }
            return doc;
        },
    });
    Object.defineProperty(doc, 'toObject', {
        enumerable: false,
        value: function () {
            return { ...doc };
        },
    });
    Object.defineProperty(doc, 'toJSON', {
        enumerable: false,
        value: function () {
            return { ...doc };
        },
    });
    return doc;
}
class MongooseQuery {
    model;
    filter;
    isSingle;
    primaryKey;
    options = {};
    sessionObj;
    constructor(model, filter, isSingle = false, primaryKey = 'id') {
        this.model = model;
        this.filter = filter;
        this.isSingle = isSingle;
        this.primaryKey = primaryKey;
    }
    select(fields) {
        if (typeof fields === 'string') {
            const parts = fields.split(/\s+/);
            const selectCols = [];
            parts.forEach(p => {
                if (!p.startsWith('-') && p) {
                    selectCols.push(p);
                }
            });
            if (selectCols.length > 0)
                this.options.select = selectCols;
        }
        else if (typeof fields === 'object') {
            const selectCols = Object.keys(fields).filter(k => fields[k] === 1 || fields[k] === true);
            if (selectCols.length > 0)
                this.options.select = selectCols;
        }
        return this;
    }
    sort(sortObj) {
        if (typeof sortObj === 'string') {
            if (sortObj.startsWith('-')) {
                this.options.orderBy = sortObj.substring(1);
                this.options.orderDirection = 'DESC';
            }
            else {
                this.options.orderBy = sortObj;
                this.options.orderDirection = 'ASC';
            }
        }
        else if (typeof sortObj === 'object') {
            const firstKey = Object.keys(sortObj)[0];
            if (firstKey) {
                this.options.orderBy = firstKey;
                this.options.orderDirection =
                    sortObj[firstKey] === -1 || sortObj[firstKey] === 'desc' ? 'DESC' : 'ASC';
            }
        }
        return this;
    }
    skip(count) {
        this.options.skip = count;
        return this;
    }
    limit(count) {
        this.options.limit = count;
        return this;
    }
    populate(arg) {
        return this;
    }
    session(sess) {
        this.sessionObj = sess;
        return this;
    }
    async then(onfulfilled, onrejected) {
        try {
            const { whereClause, params } = compileFilter(this.filter);
            const transaction = this.sessionObj ? await getSqlTransaction(this.sessionObj) : undefined;
            if (this.isSingle) {
                const result = await this.model.selectOne(whereClause || null, params, transaction);
                const wrapped = result ? createDocumentWrapper(this.model, result, this.primaryKey) : null;
                if (onfulfilled)
                    return Promise.resolve(onfulfilled(wrapped));
                return wrapped;
            }
            else {
                const results = await this.model.selectMany(whereClause || null, params, this.options, transaction);
                const wrappedList = results.map(r => createDocumentWrapper(this.model, r, this.primaryKey));
                if (onfulfilled)
                    return Promise.resolve(onfulfilled(wrappedList));
                return wrappedList;
            }
        }
        catch (err) {
            if (onrejected)
                return Promise.resolve(onrejected(err));
            throw err;
        }
    }
}
exports.MongooseQuery = MongooseQuery;
class MongooseAdapter {
    model;
    primaryKey;
    constructor(model, primaryKey = 'id') {
        this.model = model;
        this.primaryKey = primaryKey;
    }
    find(filter = {}) {
        return new MongooseQuery(this.model, filter, false, this.primaryKey);
    }
    findOne(filter = {}) {
        return new MongooseQuery(this.model, filter, true, this.primaryKey);
    }
    findById(id) {
        return this.findOne({ [this.primaryKey]: id });
    }
    async countDocuments(filter = {}, options) {
        const { whereClause, params } = compileFilter(filter);
        const transaction = options?.session ? await getSqlTransaction(options.session) : undefined;
        return await this.model.count(whereClause || null, params, transaction);
    }
    async create(data, options) {
        const transaction = options?.session ? await getSqlTransaction(options.session) : undefined;
        if (Array.isArray(data)) {
            const records = await this.model.bulkInsert(data, transaction);
            return records.map(r => createDocumentWrapper(this.model, r, this.primaryKey));
        }
        else {
            const record = await this.model.insert(data, transaction);
            return createDocumentWrapper(this.model, record, this.primaryKey);
        }
    }
    async findOneAndUpdate(filter, update, options) {
        const { whereClause, params } = compileFilter(filter);
        const transaction = options?.session ? await getSqlTransaction(options.session) : undefined;
        const record = await this.model.selectOne(whereClause || null, params, transaction);
        if (!record)
            return null;
        let updateData = { ...update };
        if (update.$set) {
            updateData = { ...updateData, ...update.$set };
            delete updateData.$set;
        }
        for (const key of Object.keys(updateData)) {
            if (key.startsWith('$')) {
                delete updateData[key];
            }
        }
        const pkValue = record[this.primaryKey];
        await this.model.update({ [this.primaryKey]: pkValue }, updateData, [], transaction);
        const finalRecord = options?.new
            ? await this.model.selectOne({ [this.primaryKey]: pkValue }, [], transaction)
            : record;
        return createDocumentWrapper(this.model, finalRecord, this.primaryKey);
    }
    async findByIdAndUpdate(id, update, options) {
        return this.findOneAndUpdate({ [this.primaryKey]: id }, update, options);
    }
    async exists(filter, options) {
        const { whereClause, params } = compileFilter(filter);
        const transaction = options?.session ? await getSqlTransaction(options.session) : undefined;
        return await this.model.exists(whereClause || null, params, transaction);
    }
    async deleteOne(filter, options) {
        const { whereClause, params } = compileFilter(filter);
        const transaction = options?.session ? await getSqlTransaction(options.session) : undefined;
        const deletedCount = await this.model.delete(whereClause || null, params, transaction);
        return { deletedCount };
    }
    async deleteMany(filter, options) {
        return this.deleteOne(filter, options);
    }
    async updateOne(filter, update, options) {
        const { whereClause, params } = compileFilter(filter);
        const transaction = options?.session ? await getSqlTransaction(options.session) : undefined;
        let updateData = { ...update };
        if (update.$set) {
            updateData = { ...updateData, ...update.$set };
            delete updateData.$set;
        }
        const modifiedCount = await this.model.update(whereClause || null, updateData, params, transaction);
        return { modifiedCount };
    }
    async updateMany(filter, update, options) {
        return this.updateOne(filter, update, options);
    }
}
exports.MongooseAdapter = MongooseAdapter;
//# sourceMappingURL=MongooseAdapter.js.map