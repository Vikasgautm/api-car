import mssql from 'mssql';
export interface SQLParam {
    name: string;
    type: mssql.ISqlType;
    value: any;
}
export declare class CommonModel<T = any> {
    private tableName;
    private primaryKey;
    private jsonFields;
    constructor(tableName: string, primaryKey: string, jsonFields?: string[]);
    private getSqlType;
    private prepareValue;
    private serialize;
    private deserialize;
    insert(data: any, transaction?: mssql.Transaction): Promise<any>;
    bulkInsert(data: any[], transaction?: mssql.Transaction): Promise<any[]>;
    update(whereClauseOrObj: any, data: any, params?: SQLParam[], transaction?: mssql.Transaction): Promise<number>;
    delete(whereClauseOrObj: any, params?: SQLParam[], transaction?: mssql.Transaction): Promise<number>;
    selectOne(whereClauseOrObj: any, params?: SQLParam[], transaction?: mssql.Transaction): Promise<any | null>;
    selectMany(whereClauseOrObj: any, params?: SQLParam[], options?: {
        select?: string[];
        orderBy?: string;
        orderDirection?: 'ASC' | 'DESC';
        skip?: number;
        limit?: number;
    }, transaction?: mssql.Transaction): Promise<any[]>;
    exists(whereClauseOrObj: any, params?: SQLParam[], transaction?: mssql.Transaction): Promise<boolean>;
    count(whereClauseOrObj: any, params?: SQLParam[], transaction?: mssql.Transaction): Promise<number>;
}
//# sourceMappingURL=CommonModel.d.ts.map