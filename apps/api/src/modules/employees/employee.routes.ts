import { Router } from 'express';

import { authenticate } from '@/middleware/auth.middleware';
import { requireRole } from '@/middleware/rbac.middleware';
import { validate } from '@/middleware/validate.middleware';
import { createEmployeeSchema } from './employee.schema';
import { EmployeeService } from './employee.service';
import { OrgChartService } from './orgChart.service';
import { redis } from '@/lib/redis';

const router = Router();
const service = new EmployeeService();
const orgChartService = new OrgChartService();

router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) return next(new Error('Missing auth user'));

    const result = await service.getMe(user.email);
    return res.json({ success: true, data: result });
  } catch (err) {
    return next(err);
  }
});

router.get('/org-chart', authenticate, requireRole(['EMPLOYEE', 'MANAGER', 'HR', 'ADMIN']), async (_req, res, next) => {
  try {
    const result = await orgChartService.getOrgChart();
    return res.json({ success: true, data: result });
  } catch (err) {
    return next(err);
  }
});

router.get('/', authenticate, requireRole(['HR', 'ADMIN']), async (req, res, next) => {
  try {
    const result = await service.listEmployees(req.query);
    return res.json({ success: true, data: result });
  } catch (err) {
    return next(err);
  }
});

router.post(
  '/',
  authenticate,
  requireRole(['HR', 'ADMIN']),
  validate(createEmployeeSchema),
  async (req, res, next) => {
    try {
      const created = await service.createEmployee(req.body);
      await redis.del('orgchart:v1');
      return res.status(201).json({ success: true, data: created });
    } catch (err) {
      return next(err);
    }
  }
);

export { router as employeeRouter };
