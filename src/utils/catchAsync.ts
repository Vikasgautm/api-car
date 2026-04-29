import { NextFunction, Request, Response } from 'express';

export const catchAsync = <T extends Request = Request>(fn: (req: T, res: Response, next: NextFunction) => Promise<any>) => {
  return (req: T, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
};
