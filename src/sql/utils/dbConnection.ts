import mysql from 'mysql2/promise';
import { sqlConfig } from '../config/db.config';

let rawPool: mysql.Pool | null = null;
let mssqlPool: MySqlConnectionPool | null = null;

function translateQuery(query: string, paramsMap: Record<string, any>): { sql: string; values: any[] } {
  // 1. Replace square brackets with backticks
  let sql = query.replace(/\[([^\]]+)\]/g, '`$1`');

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

  // 6. Replace OUTPUT INSERTED.*
  sql = sql.replace(/OUTPUT\s+INSERTED\.\*/gi, '');

  // 7. Named parameter mappings: find all @paramName and replace with ?
  const values: any[] = [];
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
  private paramsMap: Record<string, any> = {};
  private connectionOrPool: any;

  constructor(connectionOrPool: any) {
    this.connectionOrPool = connectionOrPool;
  }

  input(name: string, typeOrValue: any, value?: any): this {
    if (value === undefined) {
      this.paramsMap[name] = typeOrValue;
    } else {
      this.paramsMap[name] = value;
    }
    return this;
  }

  async query(queryString: string): Promise<{ recordset: any[]; recordsets: any[][]; rowsAffected: number[] }> {
    const { sql, values } = translateQuery(queryString, this.paramsMap);

    let rows: any;
    let fields: any;

    if (this.connectionOrPool.execute) {
      [rows, fields] = await this.connectionOrPool.execute(sql, values);
    } else {
      [rows, fields] = await this.connectionOrPool.query(sql, values);
    }

    let recordset: any[] = [];
    let affectedRows = 0;

    if (Array.isArray(rows)) {
      recordset = rows;
    } else if (rows && typeof rows === 'object') {
      affectedRows = rows.affectedRows || 0;

      // Handle transparent auto-retrieval for INSERT OUTPUT INSERTED.*
      if (
        queryString.toUpperCase().includes('INSERT INTO') &&
        queryString.toUpperCase().includes('OUTPUT INSERTED.*')
      ) {
        const tableMatch = queryString.match(/INSERT\s+INTO\s+([`\[a-zA-Z0-9_\]`]+)/i);
        if (tableMatch) {
          const tableName = tableMatch[1].replace(/[`\[\]]/g, '');
          const insertId = rows.insertId;

          let idColName: string | null = null;
          let idValue: any = null;
          for (const key of Object.keys(this.paramsMap)) {
            if (key.startsWith('i_') && key.endsWith('_id')) {
              idColName = key.substring(2);
              idValue = this.paramsMap[key];
              break;
            }
          }

          let selectSql = '';
          let selectParams: any[] = [];
          if (idColName && idValue !== undefined) {
            selectSql = `SELECT * FROM \`${tableName}\` WHERE \`${idColName}\` = ?`;
            selectParams = [idValue];
          } else if (insertId) {
            selectSql = `SELECT * FROM \`${tableName}\` WHERE \`id\` = ?`;
            selectParams = [insertId];
          }

          if (selectSql) {
            let selectRows: any;
            if (this.connectionOrPool.execute) {
              [selectRows] = await this.connectionOrPool.execute(selectSql, selectParams);
            } else {
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
  private pool: any;
  private connection: any = null;

  constructor(pool: any) {
    this.pool = pool;
  }

  async begin(): Promise<void> {
    const raw = this.pool.pool || this.pool;
    this.connection = await raw.getConnection();
    await this.connection.beginTransaction();
  }

  request(): MySqlRequest {
    if (!this.connection) {
      throw new Error('Transaction has not started. Call begin() first.');
    }
    return new MySqlRequest(this.connection);
  }

  async commit(): Promise<void> {
    if (!this.connection) {
      throw new Error('Transaction has not started or already closed.');
    }
    try {
      await this.connection.commit();
    } finally {
      this.connection.release();
      this.connection = null;
    }
  }

  async rollback(): Promise<void> {
    if (!this.connection) {
      throw new Error('Transaction has not started or already closed.');
    }
    try {
      await this.connection.rollback();
    } finally {
      this.connection.release();
      this.connection = null;
    }
  }
}

class MySqlConnectionPool {
  public pool: mysql.Pool;

  constructor(pool: mysql.Pool) {
    this.pool = pool;
  }

  request(): MySqlRequest {
    return new MySqlRequest(this.pool);
  }

  async connect(): Promise<this> {
    return this;
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}

export const mssql = {
  ConnectionPool: MySqlConnectionPool as any,
  Request: MySqlRequest as any,
  Transaction: MySqlTransaction as any,
  NVarChar: () => 'NVarChar',
  Int: () => 'Int',
  Decimal: () => 'Decimal',
  Bit: () => 'Bit',
  DateTime: () => 'DateTime',
  VarChar: () => 'VarChar',
  Text: () => 'Text',
};

export async function getPool(): Promise<MySqlConnectionPool> {
  if (mssqlPool) {
    return mssqlPool;
  }

  try {
    rawPool = mysql.createPool(sqlConfig);
    mssqlPool = new MySqlConnectionPool(rawPool);
    console.log('Connected to MySQL successfully');
    return mssqlPool;
  } catch (error) {
    console.error('MySQL connection pool creation failed: ', error);
    rawPool = null;
    mssqlPool = null;
    throw error;
  }
}

export async function executeQuery(query: string): Promise<any> {
  const connectionPool = await getPool();
  return connectionPool.request().query(query);
}

export async function executeQueryParams(
  query: string,
  params: { name: string; type: any; value: any }[]
): Promise<any> {
  const connectionPool = await getPool();
  const request = connectionPool.request();
  for (const param of params) {
    request.input(param.name, param.type, param.value);
  }
  return request.query(query);
}
