import { Router } from 'express';

import { authenticate } from '@/middleware/auth.middleware';
import { requireRole } from '@/middleware/rbac.middleware';
import { validate } from '@/middleware/validate.middleware';
import { AppError } from '@/lib/AppError';

import { signDownloadUrlSchema } from './files.schema';
import { FilesService } from './files.service';
import { upload } from './files.upload';

const router = Router();
const service = new FilesService();

router.post(
  '/upload-private',
  authenticate,
  requireRole(['EMPLOYEE', 'MANAGER', 'HR', 'ADMIN']),
  upload.single('file'),
  async (req, res, next) => {
    try {
      const file = req.file;
      if (!file) throw new AppError('FILE_REQUIRED', 400, 'File is required');

      const folder = typeof req.body.folder === 'string' && req.body.folder ? req.body.folder : 'uploads';
      const result = await service.uploadPrivate({
        folder,
        originalName: file.originalname,
        bytes: file.buffer,
        userId: req.user!.id,
      });

      return res.status(201).json({ success: true, data: result });
    } catch (err) {
      return next(err);
    }
  }
);

router.post('/sign-download', authenticate, requireRole(['EMPLOYEE', 'MANAGER', 'HR', 'ADMIN']), validate(signDownloadUrlSchema), async (req, res, next) => {
  try {
    const p = typeof req.body.path === 'string' ? req.body.path : '';
    if (!p) throw new AppError('INVALID_PATH', 400);
    const result = await service.signPrivateDownloadUrl(p);
    return res.json({ success: true, data: result });
  } catch (err) {
    return next(err);
  }
});

export { router as filesRouter };
