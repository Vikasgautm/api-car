import { Request } from 'express';
import { IUser } from '../models/user.model';
export interface AuthRequest extends Request {
    user?: IUser | any;
}
//# sourceMappingURL=auth.d.ts.map