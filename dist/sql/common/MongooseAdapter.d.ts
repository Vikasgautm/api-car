import mssql from 'mssql';
import { CommonModel } from './CommonModel';
export declare function getSqlTransaction(session: any): Promise<mssql.Transaction | undefined>;
export interface SQLParam {
    name: string;
    type: mssql.ISqlType;
    value: any;
}
export declare function compileFilter(filter: any, prefix?: string): {
    whereClause: string;
    params: SQLParam[];
};
export declare function createDocumentWrapper(model: CommonModel<any>, data: any, pkName: string): any;
export declare class MongooseQuery<T> implements PromiseLike<any> {
    private model;
    private filter;
    private isSingle;
    private primaryKey;
    private options;
    private sessionObj?;
    constructor(model: CommonModel<any>, filter: any, isSingle?: boolean, primaryKey?: string);
    select(fields: string | any): this;
    sort(sortObj: string | any): this;
    skip(count: number): this;
    limit(count: number): this;
    populate(arg: any): this;
    session(sess: any): this;
    then<TResult1 = any, TResult2 = never>(onfulfilled?: ((value: any) => TResult1 | PromiseLike<TResult1>) | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null): Promise<TResult1 | TResult2>;
}
export declare class MongooseAdapter<T extends {
    [key: string]: any;
}> {
    private model;
    private primaryKey;
    constructor(model: CommonModel<T>, primaryKey?: string);
    find(filter?: any): MongooseQuery<T>;
    findOne(filter?: any): MongooseQuery<T>;
    findById(id: any): MongooseQuery<T>;
    countDocuments(filter?: any, options?: {
        session?: any;
    }): Promise<number>;
    create(data: any | any[], options?: {
        session?: any;
    }): Promise<any>;
    findOneAndUpdate(filter: any, update: any, options?: {
        session?: any;
        new?: boolean;
    }): Promise<any>;
    findByIdAndUpdate(id: any, update: any, options?: {
        session?: any;
        new?: boolean;
    }): Promise<any>;
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
}
//# sourceMappingURL=MongooseAdapter.d.ts.map