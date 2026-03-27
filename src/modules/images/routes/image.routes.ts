import { Router } from 'express';
import { upload } from '../../../middlewares/upload.middleware';
import { catchAsync } from '../../../utils/catchAsync';
import { protect, restrictTo } from '../../../middlewares/auth.middleware';

const router = Router();

router.post(
  '/upload',
  protect,
  restrictTo('admin'),
  upload.single('image'),
  catchAsync(async (req: any, res: any) => {
    if (!req.file) {
      return res.status(400).json({ status: 'fail', message: 'No file uploaded' });
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        url: `/uploads/${req.file.filename}`,
        filename: req.file.filename,
      },
    });
  })
);

export default router;
