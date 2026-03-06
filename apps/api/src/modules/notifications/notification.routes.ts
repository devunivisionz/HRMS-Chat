import { Router } from 'express';

import { authenticate } from '@/middleware/auth.middleware';
import { requireRole } from '@/middleware/rbac.middleware';
import { validate } from '@/middleware/validate.middleware';

import {
  listNotificationsSchema,
  subscribeSchema,
  unsubscribeSchema,
} from './notification.schema';
import { NotificationService } from './notification.service';

const router = Router();
const service = new NotificationService();

router.post(
  '/subscribe',
  authenticate,
  requireRole(['EMPLOYEE', 'MANAGER', 'HR', 'ADMIN']),
  validate(subscribeSchema),
  async (req, res, next) => {
    try {
      const result = await service.subscribe(
        req.user!.id,
        req.body.subscription,
        req.body.platform,
        req.body.userAgent
      );
      return res.status(201).json({ success: true, data: result });
    } catch (err) {
      return next(err);
    }
  }
);

router.delete(
  '/subscribe',
  authenticate,
  requireRole(['EMPLOYEE', 'MANAGER', 'HR', 'ADMIN']),
  validate(unsubscribeSchema),
  async (req, res, next) => {
    try {
      const result = await service.unsubscribe(req.user!.id, req.body.endpoint);
      return res.json({ success: true, data: result });
    } catch (err) {
      return next(err);
    }
  }
);

router.get('/', authenticate, requireRole(['EMPLOYEE', 'MANAGER', 'HR', 'ADMIN']), async (req, res, next) => {
  try {
    const q = listNotificationsSchema.parse(req.query);
    const result = await service.getNotifications(req.user!.id, q.page, q.limit);
    return res.json({ success: true, data: result });
  } catch (err) {
    return next(err);
  }
});

router.patch(
  '/:id/read',
  authenticate,
  requireRole(['EMPLOYEE', 'MANAGER', 'HR', 'ADMIN']),
  async (req, res, next) => {
    try {
      const result = await service.markRead(req.params.id, req.user!.id);
      return res.json({ success: true, data: result });
    } catch (err) {
      return next(err);
    }
  }
);

router.patch(
  '/read-all',
  authenticate,
  requireRole(['EMPLOYEE', 'MANAGER', 'HR', 'ADMIN']),
  async (req, res, next) => {
    try {
      const result = await service.markAllRead(req.user!.id);
      return res.json({ success: true, data: result });
    } catch (err) {
      return next(err);
    }
  }
);

export { router as notificationRouter };
