import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { catchAsync } from '../../../utils/catchAsync';

export class AuthController {
  static signup = catchAsync(async (req: Request, res: Response) => {
    const { user, token } = await AuthService.signup(req.body);

    res.status(201).json({
      status: 'success',
      token,
      data: { user },
    });
  });

  static login = catchAsync(async (req: Request, res: Response) => {
    const { user, token } = await AuthService.login(req.body);

    res.status(200).json({
      status: 'success',
      token,
      data: { user },
    });
  });
}
