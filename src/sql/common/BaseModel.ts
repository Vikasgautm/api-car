import { mssql, getPool } from '../utils/dbConnection';

export async function getSqlTransaction(session: any): Promise<any | undefined> {
  return undefined;
}

export interface SQLParam {
  name: string;
  type: any;
  value: any;
}

function getSqlType(value: any): any {
  if (typeof value === 'string') return mssql.NVarChar();
  if (typeof value === 'number') {
    if (Number.isInteger(value)) return mssql.Int();
    return mssql.Decimal();
  }
  if (typeof value === 'boolean') return mssql.Bit();
  if (value instanceof Date) return mssql.DateTime();
  return mssql.NVarChar();
}

function prepareValue(value: any): any {
  if (value === undefined || value === null) return null;
  if (typeof value === 'object' && !(value instanceof Date)) {
    return JSON.stringify(value);
  }
  return value;
}

export function compileFilter(
  filter: any,
  prefix: string = 'f'
): { whereClause: string; params: SQLParam[] } {
  if (!filter || Object.keys(filter).length === 0) {
    return { whereClause: '', params: [] };
  }

  const clauses: string[] = [];
  const params: SQLParam[] = [];
  let paramCounter = 0;

  for (const [key, val] of Object.entries(filter)) {
    if (key === '$or' && Array.isArray(val)) {
      const orClauses: string[] = [];
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
      const andClauses: string[] = [];
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
        const opVal = (val as any)[op];
        if (op === '$ne') {
          clauses.push(`([${key}] IS NULL OR [${key}] <> @${paramName})`);
          params.push({ name: paramName, type: getSqlType(opVal), value: prepareValue(opVal) });
        } else if (op === '$in' && Array.isArray(opVal)) {
          if (opVal.length === 0) {
            clauses.push('1 = 0');
          } else {
            const inParamNames = opVal.map((_, i) => `@${paramName}_in${i}`);
            clauses.push(`[${key}] IN (${inParamNames.join(', ')})`);
            opVal.forEach((v, i) => {
              params.push({ name: `${paramName}_in${i}`, type: getSqlType(v), value: prepareValue(v) });
            });
          }
        } else if (op === '$nin' && Array.isArray(opVal)) {
          if (opVal.length > 0) {
            const ninParamNames = opVal.map((_, i) => `@${paramName}_nin${i}`);
            clauses.push(`([${key}] IS NULL OR [${key}] NOT IN (${ninParamNames.join(', ')}))`);
            opVal.forEach((v, i) => {
              params.push({ name: `${paramName}_nin${i}`, type: getSqlType(v), value: prepareValue(v) });
            });
          }
        } else if (op === '$regex') {
          clauses.push(`[${key}] LIKE @${paramName}`);
          let regexStr = typeof opVal === 'string' ? opVal : (opVal.source || '');
          regexStr = regexStr.replace(/^\^/, '').replace(/\$$/, '');
          params.push({ name: paramName, type: mssql.NVarChar(), value: `%${regexStr}%` });
        } else if (op === '$gt') {
          clauses.push(`[${key}] > @${paramName}`);
          params.push({ name: paramName, type: getSqlType(opVal), value: prepareValue(opVal) });
        } else if (op === '$gte') {
          clauses.push(`[${key}] >= @${paramName}`);
          params.push({ name: paramName, type: getSqlType(opVal), value: prepareValue(opVal) });
        } else if (op === '$lt') {
          clauses.push(`[${key}] < @${paramName}`);
          params.push({ name: paramName, type: getSqlType(opVal), value: prepareValue(opVal) });
        } else if (op === '$lte') {
          clauses.push(`[${key}] <= @${paramName}`);
          params.push({ name: paramName, type: getSqlType(opVal), value: prepareValue(opVal) });
        }
      }
    } else {
      if (val === null) {
        clauses.push(`[${key}] IS NULL`);
      } else {
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

export function createDocumentWrapper(model: BaseModel<any>, data: any, pkName: string) {
  if (!data) return data;

  const doc = { ...data };

  if (pkName && doc[pkName] !== undefined && doc._id === undefined) {
    Object.defineProperty(doc, '_id', {
      get() {
        return doc[pkName];
      },
      set(val) {
        doc[pkName] = val;
      },
      enumerable: true,
      configurable: true
    });
  }

  if (model['tableName'] === 'Users') {
    Object.defineProperty(doc, 'comparePassword', {
      enumerable: false,
      value: async function (password: string) {
        if (!doc.password) return false;
        const bcrypt = require('bcrypt');
        return await bcrypt.compare(password, doc.password);
      },
    });
  }

  Object.defineProperty(doc, 'save', {
    enumerable: false,
    value: async function (options?: { session?: any }) {
      const session = options?.session;
      const transaction = session ? await getSqlTransaction(session) : undefined;

      const pkValue = doc[pkName];
      if (pkValue !== undefined && pkValue !== null) {
        const updateData: any = {};
        for (const [k, v] of Object.entries(doc)) {
          if (k !== pkName && typeof v !== 'function') {
            updateData[k] = v;
          }
        }
        await model.updateDirect({ [pkName]: pkValue }, updateData, [], transaction);
      } else {
        const inserted = await model.insertDirect(doc, transaction);
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

  Object.defineProperty(doc, 'deleteOne', {
    enumerable: false,
    value: async function (options?: { session?: any }) {
      const session = options?.session;
      const transaction = session ? await getSqlTransaction(session) : undefined;
      const pkValue = doc[pkName];
      if (pkValue !== undefined && pkValue !== null) {
        await model.deleteDirect({ [pkName]: pkValue }, transaction);
      }
      return doc;
    },
  });

  return doc;
}

export interface SQLDocument {
  _id: any;
  save(options?: { session?: any }): Promise<any>;
  deleteOne(options?: { session?: any }): Promise<any>;
  toObject(): any;
  toJSON(): any;
}

export class SQLQuery<T extends { [key: string]: any; }, R = (T & SQLDocument)[]> implements PromiseLike<R> {
  private model: BaseModel<T>;
  private filter: any;
  private isSingle: boolean;
  private primaryKey: string;
  private distinctField?: string;
  private options: {
    select?: string[];
    orderBy?: string;
    orderDirection?: 'ASC' | 'DESC';
    skip?: number;
    limit?: number;
  } = {};
  private sessionObj?: any;

  constructor(model: BaseModel<T>, filter: any, isSingle: boolean = false, primaryKey: string = 'id') {
    this.model = model;
    this.filter = filter;
    this.isSingle = isSingle;
    this.primaryKey = primaryKey;
  }

  select(fields: string | any): this {
    if (typeof fields === 'string') {
      const parts = fields.split(/\s+/);
      const selectCols: string[] = [];
      parts.forEach(p => {
        if (!p.startsWith('-') && p) {
          selectCols.push(p);
        }
      });
      if (selectCols.length > 0) this.options.select = selectCols;
    } else if (typeof fields === 'object') {
      const selectCols = Object.keys(fields).filter(k => fields[k] === 1 || fields[k] === true);
      if (selectCols.length > 0) this.options.select = selectCols;
    }
    return this;
  }

  sort(sortObj: string | any): this {
    if (typeof sortObj === 'string') {
      if (sortObj.startsWith('-')) {
        this.options.orderBy = sortObj.substring(1);
        this.options.orderDirection = 'DESC';
      } else {
        this.options.orderBy = sortObj;
        this.options.orderDirection = 'ASC';
      }
    } else if (typeof sortObj === 'object') {
      const firstKey = Object.keys(sortObj)[0];
      if (firstKey) {
        this.options.orderBy = firstKey;
        this.options.orderDirection =
          sortObj[firstKey] === -1 || sortObj[firstKey] === 'desc' ? 'DESC' : 'ASC';
      }
    }
    return this;
  }

  skip(count: number): this {
    this.options.skip = count;
    return this;
  }

  limit(count: number): this {
    this.options.limit = count;
    return this;
  }

  populate(path: any, select?: any): this {
    return this;
  }

  session(sess: any): this {
    this.sessionObj = sess;
    return this;
  }

  lean(): this {
    return this;
  }

  distinct(field: string): SQLQuery<T, any[]> {
    this.distinctField = field;
    return this as any;
  }

  async then<TResult1 = R, TResult2 = never>(
    onfulfilled?: ((value: R) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    try {
      const { whereClause, params } = compileFilter(this.filter);
      const transaction = this.sessionObj ? await getSqlTransaction(this.sessionObj) : undefined;

      if (this.distinctField) {
        const pool = await getPool();
        const request = transaction ? transaction.request() : pool.request();
        for (const p of params) {
          request.input(p.name, p.type, p.value);
        }
        const query = `SELECT DISTINCT [${this.distinctField}] FROM [${this.model.tableName}] ${whereClause ? `WHERE ${whereClause}` : ''}`;
        const res = await request.query(query);
        const values = res.recordset.map((row: any) => row[this.distinctField!]);
        if (onfulfilled) return Promise.resolve(onfulfilled(values as any));
        return values as any;
      }

      if (this.isSingle) {
        const result = await this.model.selectOneDirect(whereClause || null, params, transaction);
        const wrapped = result ? createDocumentWrapper(this.model, result, this.primaryKey) : null;
        if (onfulfilled) return Promise.resolve(onfulfilled(wrapped as any));
        return wrapped as any;
      } else {
        const results = await this.model.selectManyDirect(whereClause || null, params, this.options, transaction);
        const wrappedList = results.map(r => createDocumentWrapper(this.model, r, this.primaryKey));
        if (onfulfilled) return Promise.resolve(onfulfilled(wrappedList as any));
        return wrappedList as any;
      }
    } catch (err) {
      if (onrejected) return Promise.resolve(onrejected(err));
      throw err;
    }
  }
}

export class SQLUpdateQuery<T> implements PromiseLike<T | null> {
  private promise: Promise<T | null>;
  private selectFields: string[] = [];

  constructor(promise: Promise<T | null>) {
    this.promise = promise;
  }

  select(fields: string): this {
    if (typeof fields === 'string') {
      const parts = fields.split(/\s+/);
      parts.forEach(p => {
        if (p.startsWith('-')) {
          this.selectFields.push(p);
        }
      });
    }
    return this;
  }

  lean(): this {
    return this;
  }

  async then<TResult1 = T | null, TResult2 = never>(
    onfulfilled?: ((value: T | null) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    try {
      const doc = await this.promise;
      if (doc && this.selectFields.length > 0) {
        const newDoc = { ...doc as any };
        for (const f of this.selectFields) {
          if (f.startsWith('-')) {
            const key = f.substring(1);
            delete newDoc[key];
          }
        }
        if (onfulfilled) return Promise.resolve(onfulfilled(newDoc));
        return newDoc;
      }
      if (onfulfilled) return Promise.resolve(onfulfilled(doc));
      return doc as any;
    } catch (err) {
      if (onrejected) return Promise.resolve(onrejected(err));
      throw err;
    }
  }
}

export class BaseModel<T extends { [key: string]: any } = any> {
  public tableName: string;
  private primaryKey: string;
  private jsonFields: string[];

  constructor(tableName: string, primaryKey: string = 'id', jsonFields: string[] = []) {
    this.tableName = tableName;
    this.primaryKey = primaryKey;
    this.jsonFields = jsonFields;
  }

  private serialize(data: any): any {
    if (!data) return data;
    const serialized = { ...data };
    for (const field of this.jsonFields) {
      if (serialized[field] !== undefined && serialized[field] !== null) {
        if (typeof serialized[field] === 'object') {
          serialized[field] = JSON.stringify(serialized[field]);
        }
      }
    }
    if (this.tableName === 'Users' && typeof serialized.password === 'string' && !serialized.password.startsWith('$2')) {
      const bcrypt = require('bcrypt');
      serialized.password = bcrypt.hashSync(serialized.password, 12);
    }
    return serialized;
  }

  private deserialize(row: any): any {
    if (!row) return row;
    const deserialized = { ...row };
    for (const field of this.jsonFields) {
      if (deserialized[field] !== undefined && deserialized[field] !== null && typeof deserialized[field] === 'string') {
        try {
          deserialized[field] = JSON.parse(deserialized[field]);
        } catch (e) {
          // keep as string
        }
      }
    }
    return deserialized;
  }

  // Pure SQL low-level methods
  async insertDirect(data: any, transaction?: any): Promise<any> {
    const pool = await getPool();
    const request = transaction ? transaction.request() : pool.request();
    const serializedData = this.serialize(data);

    const keys = Object.keys(serializedData).filter(
      k => (k !== 'id' || serializedData[k] !== undefined) && typeof serializedData[k] !== 'function'
    );

    const cols = keys.map(k => `[${k}]`).join(', ');
    const vals = keys.map(k => `@i_${k}`).join(', ');
    const query = `INSERT INTO [${this.tableName}] (${cols}) OUTPUT INSERTED.* VALUES (${vals})`;

    for (const key of keys) {
      const val = serializedData[key];
      request.input(`i_${key}`, getSqlType(val), prepareValue(val));
    }

    const result = await request.query(query);
    return this.deserialize(result.recordset[0]);
  }

  async bulkInsertDirect(data: any[], transaction?: any): Promise<any[]> {
    const inserted: any[] = [];
    for (const item of data) {
      const record = await this.insertDirect(item, transaction);
      inserted.push(record);
    }
    return inserted;
  }

  async updateDirect(
    whereClauseOrObj: any,
    data: any,
    params: SQLParam[] = [],
    transaction?: any
  ): Promise<number> {
    const pool = await getPool();
    const request = transaction ? transaction.request() : pool.request();
    const serializedData = this.serialize(data);

    let whereClause = '';
    const localParams: SQLParam[] = [];

    if (typeof whereClauseOrObj === 'string') {
      whereClause = whereClauseOrObj;
      localParams.push(...params);
    } else if (whereClauseOrObj && typeof whereClauseOrObj === 'object') {
      const clauses: string[] = [];
      let idx = 0;
      for (const [key, val] of Object.entries(whereClauseOrObj)) {
        const paramName = `w_${key}_${idx++}`;
        clauses.push(`[${key}] = @${paramName}`);
        localParams.push({ name: paramName, type: getSqlType(val), value: prepareValue(val) });
      }
      whereClause = clauses.join(' AND ');
    }

    const setClauses: string[] = [];
    const updateKeys = Object.keys(serializedData).filter(
      k => k !== 'id' && k !== this.primaryKey && typeof serializedData[k] !== 'function'
    );

    for (const key of updateKeys) {
      setClauses.push(`[${key}] = @u_${key}`);
    }

    if (setClauses.length === 0) return 0;

    const query = `UPDATE [${this.tableName}] SET ${setClauses.join(', ')} ${whereClause ? `WHERE ${whereClause}` : ''}`;

    const addedParams = new Set<string>();
    const register = (name: string, type: any, value: any) => {
      if (!addedParams.has(name)) {
        request.input(name, type, value);
        addedParams.add(name);
      }
    };

    for (const key of updateKeys) {
      const val = serializedData[key];
      register(`u_${key}`, getSqlType(val), prepareValue(val));
    }

    for (const p of localParams) {
      register(p.name, p.type, p.value);
    }

    const result = await request.query(query);
    return result.rowsAffected[0] || 0;
  }

  async deleteDirect(
    whereClauseOrObj: any,
    params: SQLParam[] = [],
    transaction?: any
  ): Promise<number> {
    const pool = await getPool();
    const request = transaction ? transaction.request() : pool.request();

    let whereClause = '';
    const localParams: SQLParam[] = [];

    if (typeof whereClauseOrObj === 'string') {
      whereClause = whereClauseOrObj;
      localParams.push(...params);
    } else if (whereClauseOrObj && typeof whereClauseOrObj === 'object') {
      const clauses: string[] = [];
      let idx = 0;
      for (const [key, val] of Object.entries(whereClauseOrObj)) {
        const paramName = `w_${key}_${idx++}`;
        clauses.push(`[${key}] = @${paramName}`);
        localParams.push({ name: paramName, type: getSqlType(val), value: prepareValue(val) });
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

  async selectOneDirect(
    whereClauseOrObj: any,
    params: SQLParam[] = [],
    transaction?: any
  ): Promise<any | null> {
    const pool = await getPool();
    const request = transaction ? transaction.request() : pool.request();

    let whereClause = '';
    const localParams: SQLParam[] = [];

    if (typeof whereClauseOrObj === 'string') {
      whereClause = whereClauseOrObj;
      localParams.push(...params);
    } else if (whereClauseOrObj && typeof whereClauseOrObj === 'object') {
      const clauses: string[] = [];
      let idx = 0;
      for (const [key, val] of Object.entries(whereClauseOrObj)) {
        const paramName = `w_${key}_${idx++}`;
        clauses.push(`[${key}] = @${paramName}`);
        localParams.push({ name: paramName, type: getSqlType(val), value: prepareValue(val) });
      }
      whereClause = clauses.join(' AND ');
    }

    const query = `SELECT TOP 1 * FROM [${this.tableName}] ${whereClause ? `WHERE ${whereClause}` : ''}`;

    for (const p of localParams) {
      request.input(p.name, p.type, p.value);
    }

    const result = await request.query(query);
    if (result.recordset.length === 0) return null;
    return this.deserialize(result.recordset[0]);
  }

  async selectManyDirect(
    whereClauseOrObj: any,
    params: SQLParam[] = [],
    options?: {
      select?: string[];
      orderBy?: string;
      orderDirection?: 'ASC' | 'DESC';
      skip?: number;
      limit?: number;
    },
    transaction?: any
  ): Promise<any[]> {
    const pool = await getPool();
    const request = transaction ? transaction.request() : pool.request();

    let whereClause = '';
    const localParams: SQLParam[] = [];

    if (typeof whereClauseOrObj === 'string') {
      whereClause = whereClauseOrObj;
      localParams.push(...params);
    } else if (whereClauseOrObj && typeof whereClauseOrObj === 'object') {
      const clauses: string[] = [];
      let idx = 0;
      for (const [key, val] of Object.entries(whereClauseOrObj)) {
        const paramName = `w_${key}_${idx++}`;
        clauses.push(`[${key}] = @${paramName}`);
        localParams.push({ name: paramName, type: getSqlType(val), value: prepareValue(val) });
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
      query = `SELECT ${selectCols} FROM [${this.tableName}] ${
        whereClause ? `WHERE ${whereClause}` : ''
      } ${orderByClause} LIMIT ${fetch} OFFSET ${offset}`;
    } else {
      query = `SELECT ${selectCols} FROM [${this.tableName}] ${
        whereClause ? `WHERE ${whereClause}` : ''
      } ${orderByClause}`;
    }

    for (const p of localParams) {
      request.input(p.name, p.type, p.value);
    }

    const result = await request.query(query);
    return result.recordset.map((row: any) => this.deserialize(row));
  }

  async existsDirect(
    whereClauseOrObj: any,
    params: SQLParam[] = [],
    transaction?: any
  ): Promise<boolean> {
    const pool = await getPool();
    const request = transaction ? transaction.request() : pool.request();

    let whereClause = '';
    const localParams: SQLParam[] = [];

    if (typeof whereClauseOrObj === 'string') {
      whereClause = whereClauseOrObj;
      localParams.push(...params);
    } else if (whereClauseOrObj && typeof whereClauseOrObj === 'object') {
      const clauses: string[] = [];
      let idx = 0;
      for (const [key, val] of Object.entries(whereClauseOrObj)) {
        const paramName = `w_${key}_${idx++}`;
        clauses.push(`[${key}] = @${paramName}`);
        localParams.push({ name: paramName, type: getSqlType(val), value: prepareValue(val) });
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

  async countDirect(
    whereClauseOrObj: any,
    params: SQLParam[] = [],
    transaction?: any
  ): Promise<number> {
    const pool = await getPool();
    const request = transaction ? transaction.request() : pool.request();

    let whereClause = '';
    const localParams: SQLParam[] = [];

    if (typeof whereClauseOrObj === 'string') {
      whereClause = whereClauseOrObj;
      localParams.push(...params);
    } else if (whereClauseOrObj && typeof whereClauseOrObj === 'object') {
      const clauses: string[] = [];
      let idx = 0;
      for (const [key, val] of Object.entries(whereClauseOrObj)) {
        const paramName = `w_${key}_${idx++}`;
        clauses.push(`[${key}] = @${paramName}`);
        localParams.push({ name: paramName, type: getSqlType(val), value: prepareValue(val) });
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

  // Mongoose-compatible interface methods
  find(filter: any = {}): SQLQuery<T, (T & SQLDocument)[]> {
    return new SQLQuery<T, (T & SQLDocument)[]>(this, filter, false, this.primaryKey);
  }

  findOne(filter: any = {}): SQLQuery<T, (T & SQLDocument) | null> {
    return new SQLQuery<T, (T & SQLDocument) | null>(this, filter, true, this.primaryKey);
  }

  findById(id: any): SQLQuery<T, (T & SQLDocument) | null> {
    return this.findOne({ [this.primaryKey]: id });
  }

  async countDocuments(filter: any = {}, options?: { session?: any }): Promise<number> {
    const { whereClause, params } = compileFilter(filter);
    const transaction = options?.session ? await getSqlTransaction(options.session) : undefined;
    return await this.countDirect(whereClause || null, params, transaction);
  }

  async distinct(field: string, filter: any = {}): Promise<any[]> {
    const { whereClause, params } = compileFilter(filter);
    const queryStr = `SELECT DISTINCT [${field}] FROM [${this.tableName}]${whereClause ? ' WHERE ' + whereClause : ''}`;
    const pool = await getPool();
    const req = pool.request();
    params.forEach(p => {
      req.input(p.name, p.type, p.value);
    });
    const result = await req.query(queryStr);
    return result.recordset.map(row => row[field]).filter(val => val !== undefined && val !== null);
  }

  async create(data: any | any[], options?: { session?: any }): Promise<any> {
    const transaction = options?.session ? await getSqlTransaction(options.session) : undefined;
    if (Array.isArray(data)) {
      const records = await this.bulkInsertDirect(data, transaction);
      return records.map(r => createDocumentWrapper(this, r, this.primaryKey));
    } else {
      const record = await this.insertDirect(data, transaction);
      return createDocumentWrapper(this, record, this.primaryKey);
    }
  }

  createDraft(data: any): T & SQLDocument {
    return createDocumentWrapper(this, data, this.primaryKey);
  }

  findOneAndUpdate(
    filter: any,
    update: any,
    options?: { session?: any; new?: boolean; returnDocument?: 'before' | 'after'; runValidators?: boolean; upsert?: boolean }
  ): SQLUpdateQuery<T & SQLDocument> {
    const promise = this.findOneAndUpdateInternal(filter, update, options);
    return new SQLUpdateQuery<T & SQLDocument>(promise as any);
  }

  findByIdAndUpdate(
    id: any,
    update: any,
    options?: { session?: any; new?: boolean; returnDocument?: 'before' | 'after'; runValidators?: boolean; upsert?: boolean }
  ): SQLUpdateQuery<T & SQLDocument> {
    return this.findOneAndUpdate({ [this.primaryKey]: id }, update, options);
  }

  private async findOneAndUpdateInternal(
    filter: any,
    update: any,
    options?: { session?: any; new?: boolean; returnDocument?: 'before' | 'after'; runValidators?: boolean; upsert?: boolean }
  ): Promise<any> {
    const { whereClause, params } = compileFilter(filter);
    const transaction = options?.session ? await getSqlTransaction(options.session) : undefined;

    let record = await this.selectOneDirect(whereClause || null, params, transaction);
    if (!record) {
      if (options?.upsert) {
        let insertData = { ...filter, ...update };
        if (update.$set) {
          insertData = { ...insertData, ...update.$set };
        }
        if (insertData.$set) delete insertData.$set;
        for (const key of Object.keys(insertData)) {
          if (key.startsWith('$')) {
            delete insertData[key];
          }
        }
        const inserted = await this.insertDirect(insertData, transaction);
        return createDocumentWrapper(this, inserted, this.primaryKey);
      }
      return null;
    }

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
    await this.updateDirect({ [this.primaryKey]: pkValue } as any, updateData, [], transaction);

    const finalRecord = (options?.new || options?.returnDocument === 'after')
      ? await this.selectOneDirect({ [this.primaryKey]: pkValue } as any, [], transaction)
      : record;

    return createDocumentWrapper(this, finalRecord, this.primaryKey);
  }

  async exists(filter: any, options?: { session?: any }): Promise<boolean> {
    const { whereClause, params } = compileFilter(filter);
    const transaction = options?.session ? await getSqlTransaction(options.session) : undefined;
    return await this.existsDirect(whereClause || null, params, transaction);
  }

  async deleteOne(filter: any, options?: { session?: any }): Promise<{ deletedCount: number }> {
    const { whereClause, params } = compileFilter(filter);
    const transaction = options?.session ? await getSqlTransaction(options.session) : undefined;
    const deletedCount = await this.deleteDirect(whereClause || null, params, transaction);
    return { deletedCount };
  }

  async deleteMany(filter: any, options?: { session?: any }): Promise<{ deletedCount: number }> {
    return this.deleteOne(filter, options);
  }

  async findOneAndDelete(filter: any, options?: { session?: any }): Promise<any> {
    const { whereClause, params } = compileFilter(filter);
    const transaction = options?.session ? await getSqlTransaction(options.session) : undefined;
    const record = await this.selectOneDirect(whereClause || null, params, transaction);
    if (!record) return null;
    await this.deleteDirect(whereClause || null, params, transaction);
    return createDocumentWrapper(this, record, this.primaryKey);
  }

  async updateOne(filter: any, update: any, options?: { session?: any }): Promise<{ modifiedCount: number }> {
    const { whereClause, params } = compileFilter(filter);
    const transaction = options?.session ? await getSqlTransaction(options.session) : undefined;
    let updateData = { ...update };
    if (update.$set) {
      updateData = { ...updateData, ...update.$set };
      delete updateData.$set;
    }
    const modifiedCount = await this.updateDirect(whereClause || null, updateData, params, transaction);
    return { modifiedCount };
  }

  async updateMany(filter: any, update: any, options?: { session?: any }): Promise<{ modifiedCount: number }> {
    return this.updateOne(filter, update, options);
  }

  async bulkWrite(ops: any[], options?: { session?: any; ordered?: boolean }): Promise<any> {
    const transaction = options?.session ? await getSqlTransaction(options.session) : undefined;
    for (const op of ops) {
      if (op.updateOne) {
        const { filter, update } = op.updateOne;
        await this.updateOne(filter, update, { session: options?.session });
      } else if (op.insertOne) {
        const { document } = op.insertOne;
        await this.create(document, { session: options?.session });
      } else if (op.deleteOne) {
        const { filter } = op.deleteOne;
        await this.deleteOne(filter, { session: options?.session });
      }
    }
    return { ok: 1 };
  }

  async insertMany(docs: any[], options?: { session?: any }): Promise<(T & SQLDocument)[]> {
    const transaction = options?.session ? await getSqlTransaction(options.session) : undefined;
    const records = await this.bulkInsertDirect(docs, transaction);
    return records.map(r => createDocumentWrapper(this, r, this.primaryKey));
  }

  async aggregate(pipeline: any[], options?: { session?: any }): Promise<any[]> {
    const transaction = options?.session ? await getSqlTransaction(options.session) : undefined;
    const { sql, params, compoundKeys } = compileAggregation(this.tableName, pipeline);
    const pool = await getPool();
    const request = transaction ? transaction.request() : pool.request();
    for (const p of params) {
      request.input(p.name, p.type, p.value);
    }
    const res = await request.query(sql);
    const formatted = res.recordset.map((row: any) => {
      const newRow = { ...row };
      if (compoundKeys && compoundKeys.length > 0) {
        const idObj: any = {};
        for (const key of compoundKeys) {
          idObj[key] = newRow[`__grp_${key}`];
          delete newRow[`__grp_${key}`];
        }
        newRow._id = idObj;
      }
      return newRow;
    });
    return formatted;
  }
}

function compileAggregation(tableName: string, pipeline: any[]): { sql: string; params: SQLParam[]; compoundKeys: string[] } {
  let whereClauses: string[] = [];
  const params: SQLParam[] = [];
  let groupByCols: string[] = [];
  let selectCols: string[] = [];
  let orderByClause = '';
  let limitValue: number | null = null;
  let offsetValue: number | null = null;
  const compoundKeys: string[] = [];
  
  let paramIdx = 0;

  for (const stage of pipeline) {
    if (stage.$match) {
      const { whereClause, params: matchParams } = compileFilter(stage.$match);
      if (whereClause) {
        whereClauses.push(whereClause);
        for (const p of matchParams) {
          params.push(p);
        }
      }
    } else if (stage.$group) {
      const idVal = stage.$group._id;
      if (idVal) {
        if (typeof idVal === 'string' && idVal.startsWith('$')) {
          const colName = idVal.substring(1);
          groupByCols.push(`[${colName}]`);
          selectCols.push(`[${colName}] as [_id]`);
        } else if (typeof idVal === 'object') {
          const keys = Object.keys(idVal);
          for (const key of keys) {
            const val = idVal[key];
            if (typeof val === 'string' && val.startsWith('$')) {
              groupByCols.push(`[${val.substring(1)}]`);
              selectCols.push(`[${val.substring(1)}] as [__grp_${key}]`);
              compoundKeys.push(key);
            }
          }
        }
      }

      for (const [key, val] of Object.entries(stage.$group)) {
        if (key === '_id') continue;
        if (val && typeof val === 'object') {
          const opt = Object.keys(val)[0];
          const optVal = (val as any)[opt];
          if (opt === '$sum') {
            if (optVal === 1) {
              selectCols.push(`COUNT(*) as [${key}]`);
            } else if (typeof optVal === 'string' && optVal.startsWith('$')) {
              selectCols.push(`SUM([${optVal.substring(1)}]) as [${key}]`);
            }
          } else if (opt === '$avg' && typeof optVal === 'string' && optVal.startsWith('$')) {
            selectCols.push(`AVG([${optVal.substring(1)}]) as [${key}]`);
          } else if (opt === '$min' && typeof optVal === 'string' && optVal.startsWith('$')) {
            selectCols.push(`MIN([${optVal.substring(1)}]) as [${key}]`);
          } else if (opt === '$max' && typeof optVal === 'string' && optVal.startsWith('$')) {
            selectCols.push(`MAX([${optVal.substring(1)}]) as [${key}]`);
          }
        }
      }
    } else if (stage.$project) {
      if (selectCols.length === 0) {
        for (const [key, val] of Object.entries(stage.$project)) {
          if (val === 1 || val === true) {
            selectCols.push(`[${key}]`);
          } else if (typeof val === 'string' && val.startsWith('$')) {
            selectCols.push(`[${val.substring(1)}] as [${key}]`);
          }
        }
      }
    } else if (stage.$sort) {
      const sortParts: string[] = [];
      for (const [key, val] of Object.entries(stage.$sort)) {
        const dir = val === -1 ? 'DESC' : 'ASC';
        sortParts.push(`[${key}] ${dir}`);
      }
      if (sortParts.length > 0) {
        orderByClause = `ORDER BY ${sortParts.join(', ')}`;
      }
    } else if (stage.$limit) {
      limitValue = Number(stage.$limit);
    } else if (stage.$skip) {
      offsetValue = Number(stage.$skip);
    }
  }

  let selectClause = selectCols.length > 0 ? selectCols.join(', ') : '*';

  let sql = `SELECT ${selectClause} FROM [${tableName}]`;
  if (whereClauses.length > 0) {
    sql += ` WHERE ${whereClauses.join(' AND ')}`;
  }
  if (groupByCols.length > 0) {
    sql += ` GROUP BY ${groupByCols.join(', ')}`;
  }
  if (orderByClause) {
    sql += ` ${orderByClause}`;
  }

  if (limitValue !== null || offsetValue !== null) {
    const lim = limitValue !== null ? limitValue : 100000000;
    sql += ` LIMIT ${lim}`;
    if (offsetValue !== null) {
      sql += ` OFFSET ${offsetValue}`;
    }
  }

  return { sql, params, compoundKeys };
}
