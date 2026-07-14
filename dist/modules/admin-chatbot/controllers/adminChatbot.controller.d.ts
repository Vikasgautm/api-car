import { NextFunction, Response } from 'express';
import { AuthRequest } from '../../../types/auth';
export declare class AdminChatbotController {
    static ask(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    static performAction(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
}
