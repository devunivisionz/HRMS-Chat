import { Router } from 'express';

import { authenticate } from '@/middleware/auth.middleware';
import { requireRole } from '@/middleware/rbac.middleware';
import { validate } from '@/middleware/validate.middleware';
import { auditLog } from '@/middleware/audit.middleware';

import { leaveApprovalSchema, leaveRequestSchema, listLeavesSchema } from './leave.schema';
import { LeaveService } from './leave.service';
import { LeaveBalanceService } from './leaveBalance.service';
import { redis } from '@/lib/redis';

const router = Router();
const service = new LeaveService();
const balanceService = new LeaveBalanceService();

router.get('/balances', authenticate, requireRole(['EMPLOYEE', 'MANAGER', 'HR', 'ADMIN']), async (req, res, next) => {
  try {
    const year = typeof req.query.year === 'string' ? Number(req.query.year) : new Date().getUTCFullYear();
    const employeeId = typeof req.query.employeeId === 'string' ? req.query.employeeId : req.user!.id;
    const result = await balanceService.getBalances({ userId: req.user!.id, role: req.user!.role }, employeeId, year);
    return res.json({ success: true, data: result });
  } catch (err) {
    return next(err);
  }
});

router.get('/', authenticate, requireRole(['EMPLOYEE', 'MANAGER', 'HR', 'ADMIN']), async (req, res, next) => {
  try {
    const query = listLeavesSchema.parse(req.query);
    const result = await service.list({ userId: req.user!.id, role: req.user!.role }, query);
    return res.json({ success: true, data: result });
  } catch (err) {
    return next(err);
  }
});

router.post(
  '/',
  authenticate,
  requireRole(['EMPLOYEE', 'MANAGER', 'HR', 'ADMIN']),
  validate(leaveRequestSchema),
  async (req, res, next) => {
    try {
      const created = await service.create(req.user!.id, req.body);
      await redis.del(`leave:balances:${req.user!.id}:*`);
      return res.status(201).json({ success: true, data: created });
    } catch (err) {
      return next(err);
    }
  }
);

router.patch(
  '/:id/approve',
  authenticate,
  requireRole(['MANAGER', 'HR', 'ADMIN']),
  validate(leaveApprovalSchema),
  auditLog('LEAVE_APPROVED'),
  async (req, res, next) => {
    try {
      type ApproveResult = { id: string; status: string; employeeId: string };
      const updated: ApproveResult = await service.approve(req.params.id, req.user!.id, req.body) as ApproveResult;
      await redis.del(`leave:balances:${updated.employeeId}:*`);
      return res.json({ success: true, data: { id: updated.id, status: updated.status } });
    } catch (err) {
      return next(err);
    }
  }
);

export { router as leaveRouter };
