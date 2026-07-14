import { Request } from 'express';
export interface JwtPayload {
    id: string;
    user_id: string;
    email: string;
    role: string;
}
export interface AuthRequest extends Omit<Request, 'user'> {
    user?: JwtPayload;
}
