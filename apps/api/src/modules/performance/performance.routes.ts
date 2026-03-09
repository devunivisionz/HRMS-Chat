import { Router } from 'express';

import { authenticate } from '@/middleware/auth.middleware';
import { requireRole } from '@/middleware/rbac.middleware';
import { validate } from '@/middleware/validate.middleware';

import { createGoalSchema, listGoalsSchema, rateGoalSchema } from './performance.schema';
import { PerformanceService } from './performance.service';

const router = Router();
const service = new PerformanceService();

router.get('/', authenticate, requireRole(['EMPLOYEE', 'MANAGER', 'HR', 'ADMIN']), async (req, res, next) => {
  try {
    const query = listGoalsSchema.parse(req.query);
    const result = await service.listGoals({ userId: req.user!.id, role: req.user!.role }, query);
    return res.json({ success: true, data: result });
  } catch (err) {
    return next(err);
  }
});

router.post(
  '/',
  authenticate,
  requireRole(['MANAGER', 'HR', 'ADMIN']),
  validate(createGoalSchema),
  async (req, res, next) => {
    try {
      const created = await service.createGoal({ userId: req.user!.id, role: req.user!.role }, req.body);
      return res.status(201).json({ success: true, data: created });
    } catch (err) {
      return next(err);
    }
  }
);

router.patch(
  '/:id/rate',
  authenticate,
  requireRole(['MANAGER', 'HR', 'ADMIN']),
  validate(rateGoalSchema),
  async (req, res, next) => {
    try {
      const updated = await service.rateGoal(String(req.params.id), { userId: req.user!.id, role: req.user!.role }, req.body);
      return res.json({ success: true, data: updated });
    } catch (err) {
      return next(err);
    }
  }
);

export { router as performanceRouter };
