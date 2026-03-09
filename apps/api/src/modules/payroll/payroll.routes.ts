import { Router } from 'express';

import { authenticate } from '@/middleware/auth.middleware';
import { requireRole } from '@/middleware/rbac.middleware';
import { validate } from '@/middleware/validate.middleware';

import { listPayrollSchema, runPayrollSchema } from './payroll.schema';
import { PayrollService } from './payroll.service';

const router = Router();
const service = new PayrollService();

router.get('/', authenticate, requireRole(['EMPLOYEE', 'MANAGER', 'HR', 'ADMIN']), async (req, res, next) => {
  try {
    const query = listPayrollSchema.parse(req.query);
    const result = await service.list({ userId: req.user!.id, role: req.user!.role }, query);
    return res.json({ success: true, data: result });
  } catch (err) {
    return next(err);
  }
});

router.post(
  '/run',
  authenticate,
  requireRole(['HR', 'ADMIN']),
  validate(runPayrollSchema),
  async (req, res, next) => {
    try {
      const result = await service.runPayroll(req.user!.id, req.body);
      return res.status(202).json({ success: true, data: result });
    } catch (err) {
      return next(err);
    }
  }
);

router.post('/runs/:id/lock', authenticate, requireRole(['HR', 'ADMIN']), async (req, res, next) => {
  try {
    const result = await service.lockRun(String(req.params.id));
    return res.json({ success: true, data: result });
  } catch (err) {
    return next(err);
  }
});

export { router as payrollRouter };
