import { NextFunction, Request, Response } from 'express';
import { ZodSchema } from 'zod';
export declare const validate: (schema: ZodSchema<any>) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const validateBody: (schema: ZodSchema<any>) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const validateQuery: (schema: ZodSchema<any>) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const validateParams: (schema: ZodSchema<any>) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const validateOptional: (schema: ZodSchema<any>) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=validate.middleware.d.ts.map