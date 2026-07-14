import { RequestHandler } from 'express';
export declare const protect: RequestHandler;
export declare const restrictTo: (...roles: string[]) => RequestHandler;
export declare const restrictToEditorOrAbove: (...roles: string[]) => RequestHandler;
export declare const optionalAuth: RequestHandler;
