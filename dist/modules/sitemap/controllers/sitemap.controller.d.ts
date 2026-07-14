import { Request, Response, NextFunction } from 'express';
export declare class SitemapController {
    static getXml(req: Request, res: Response, next: NextFunction): Promise<void>;
    static getUrls(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
}
