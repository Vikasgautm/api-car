import mysql from 'mysql2/promise';
declare class MySqlRequest {
    private paramsMap;
    private connectionOrPool;
    constructor(connectionOrPool: any);
    input(name: string, typeOrValue: any, value?: any): this;
    query(queryString: string): Promise<{
        recordset: any[];
        recordsets: any[][];
        rowsAffected: number[];
    }>;
}
declare class MySqlConnectionPool {
    pool: mysql.Pool;
    constructor(pool: mysql.Pool);
    request(): MySqlRequest;
    connect(): Promise<this>;
    close(): Promise<void>;
}
export declare const mssql: {
    ConnectionPool: any;
    Request: any;
    Transaction: any;
    NVarChar: () => string;
    Int: () => string;
    Decimal: () => string;
    Bit: () => string;
    DateTime: () => string;
    VarChar: () => string;
    Text: () => string;
};
export declare function getPool(): Promise<MySqlConnectionPool>;
export declare function executeQuery(query: string): Promise<any>;
export declare function executeQueryParams(query: string, params: {
    name: string;
    type: any;
    value: any;
}[]): Promise<any>;
export {};
