export declare function getSqlTransaction(session: any): Promise<any | undefined>;
export interface SQLParam {
    name: string;
    type: any;
    value: any;
}
export declare function compileFilter(filter: any, prefix?: string): {
    whereClause: string;
    params: SQLParam[];
};
export declare function createDocumentWrapper(model: BaseModel<any>, data: any, pkName: string): any;
export interface SQLDocument {
    _id: any;
    save(options?: {
        session?: any;
    }): Promise<any>;
    deleteOne(options?: {
        session?: any;
    }): Promise<any>;
    toObject(): any;
    toJSON(): any;
}
export declare class SQLQuery<T extends {
    [key: string]: any;
}, R = (T & SQLDocument)[]> implements PromiseLike<R> {
    private model;
    private filter;
    private isSingle;
    private primaryKey;
    private distinctField?;
    private options;
    private sessionObj?;
    constructor(model: BaseModel<T>, filter: any, isSingle?: boolean, primaryKey?: string);
    select(fields: string | any): this;
    sort(sortObj: string | any): this;
    skip(count: number): this;
    limit(count: number): this;
    populate(path: any, select?: any): this;
    session(sess: any): this;
    lean(): this;
    distinct(field: string): SQLQuery<T, any[]>;
    then<TResult1 = R, TResult2 = never>(onfulfilled?: ((value: R) => TResult1 | PromiseLike<TResult1>) | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null): Promise<TResult1 | TResult2>;
}
export declare class SQLUpdateQuery<T> implements PromiseLike<T | null> {
    private promise;
    private selectFields;
    constructor(promise: Promise<T | null>);
    select(fields: string): this;
    lean(): this;
    then<TResult1 = T | null, TResult2 = never>(onfulfilled?: ((value: T | null) => TResult1 | PromiseLike<TResult1>) | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null): Promise<TResult1 | TResult2>;
}
export declare class BaseModel<T extends {
    [key: string]: any;
} = any> {
    tableName: string;
    private primaryKey;
    private jsonFields;
    constructor(tableName: string, primaryKey?: string, jsonFields?: string[]);
    private serialize;
    private deserialize;
    insertDirect(data: any, transaction?: any): Promise<any>;
    bulkInsertDirect(data: any[], transaction?: any): Promise<any[]>;
    updateDirect(whereClauseOrObj: any, data: any, params?: SQLParam[], transaction?: any): Promise<number>;
    deleteDirect(whereClauseOrObj: any, params?: SQLParam[], transaction?: any): Promise<number>;
    selectOneDirect(whereClauseOrObj: any, params?: SQLParam[], transaction?: any): Promise<any | null>;
    selectManyDirect(whereClauseOrObj: any, params?: SQLParam[], options?: {
        select?: string[];
        orderBy?: string;
        orderDirection?: 'ASC' | 'DESC';
        skip?: number;
        limit?: number;
    }, transaction?: any): Promise<any[]>;
    existsDirect(whereClauseOrObj: any, params?: SQLParam[], transaction?: any): Promise<boolean>;
    countDirect(whereClauseOrObj: any, params?: SQLParam[], transaction?: any): Promise<number>;
    find(filter?: any): SQLQuery<T, (T & SQLDocument)[]>;
    findOne(filter?: any): SQLQuery<T, (T & SQLDocument) | null>;
    findById(id: any): SQLQuery<T, (T & SQLDocument) | null>;
    countDocuments(filter?: any, options?: {
        session?: any;
    }): Promise<number>;
    distinct(field: string, filter?: any): Promise<any[]>;
    create(data: any | any[], options?: {
        session?: any;
    }): Promise<any>;
    createDraft(data: any): T & SQLDocument;
    findOneAndUpdate(filter: any, update: any, options?: {
        session?: any;
        new?: boolean;
        returnDocument?: 'before' | 'after';
        runValidators?: boolean;
        upsert?: boolean;
    }): SQLUpdateQuery<T & SQLDocument>;
    findByIdAndUpdate(id: any, update: any, options?: {
        session?: any;
        new?: boolean;
        returnDocument?: 'before' | 'after';
        runValidators?: boolean;
        upsert?: boolean;
    }): SQLUpdateQuery<T & SQLDocument>;
    private findOneAndUpdateInternal;
    exists(filter: any, options?: {
        session?: any;
    }): Promise<boolean>;
    deleteOne(filter: any, options?: {
        session?: any;
    }): Promise<{
        deletedCount: number;
    }>;
    deleteMany(filter: any, options?: {
        session?: any;
    }): Promise<{
        deletedCount: number;
    }>;
    findOneAndDelete(filter: any, options?: {
        session?: any;
    }): Promise<any>;
    updateOne(filter: any, update: any, options?: {
        session?: any;
    }): Promise<{
        modifiedCount: number;
    }>;
    updateMany(filter: any, update: any, options?: {
        session?: any;
    }): Promise<{
        modifiedCount: number;
    }>;
    bulkWrite(ops: any[], options?: {
        session?: any;
        ordered?: boolean;
    }): Promise<any>;
    insertMany(docs: any[], options?: {
        session?: any;
    }): Promise<(T & SQLDocument)[]>;
    aggregate(pipeline: any[], options?: {
        session?: any;
    }): Promise<any[]>;
}
