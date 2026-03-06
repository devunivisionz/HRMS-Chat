import { Router } from 'express';

import { authenticate } from '@/middleware/auth.middleware';
import { requireRole } from '@/middleware/rbac.middleware';

import { listChannelsSchema, listMessagesSchema, searchMessagesSchema } from './chat.schema';
import { ChatService } from './chat.service';

const router = Router();
const service = new ChatService();

router.get('/channels', authenticate, requireRole(['EMPLOYEE', 'MANAGER', 'HR', 'ADMIN']), async (req, res, next) => {
  try {
    const query = listChannelsSchema.parse(req.query);
    const result = await service.listChannels(req.user!.id, query);
    return res.json({ success: true, data: result });
  } catch (err) {
    return next(err);
  }
});

router.get('/messages', authenticate, requireRole(['EMPLOYEE', 'MANAGER', 'HR', 'ADMIN']), async (req, res, next) => {
  try {
    const query = listMessagesSchema.parse(req.query);
    const result = await service.listMessages(req.user!.id, query);
    return res.json({ success: true, data: result });
  } catch (err) {
    return next(err);
  }
});

router.get('/search', authenticate, requireRole(['EMPLOYEE', 'MANAGER', 'HR', 'ADMIN']), async (req, res, next) => {
  try {
    const query = searchMessagesSchema.parse(req.query);
    const result = await service.searchMessages(req.user!.id, query);
    return res.json({ success: true, data: result });
  } catch (err) {
    return next(err);
  }
});

export { router as chatRouter };
