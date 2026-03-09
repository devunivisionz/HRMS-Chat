import { Router } from 'express';

import { authenticate } from '@/middleware/auth.middleware';
import { requireRole } from '@/middleware/rbac.middleware';
import { validate } from '@/middleware/validate.middleware';

import { clockInSchema, clockOutSchema, listAttendanceSchema, dailyAttendanceSchema } from './attendance.schema';
import { AttendanceService } from './attendance.service';

const router = Router();
const service = new AttendanceService();

router.get(
  '/daily',
  authenticate,
  requireRole(['MANAGER', 'HR', 'ADMIN']),
  async (req, res, next) => {
    try {
      const query = dailyAttendanceSchema.parse(req.query);
      const result = await service.daily({ userId: req.user!.id, role: req.user!.role }, query);
      return res.json({ success: true, data: result });
    } catch (err) {
      return next(err);
    }
  }
);

router.get(
  '/',
  authenticate,
  requireRole(['EMPLOYEE', 'MANAGER', 'HR', 'ADMIN']),
  async (req, res, next) => {
    try {
      const query = listAttendanceSchema.parse(req.query);
      const result = await service.list({ userId: req.user!.id, role: req.user!.role }, query);
      return res.json({ success: true, data: result });
    } catch (err) {
      return next(err);
    }
  }
);

router.post(
  '/clock-in',
  authenticate,
  requireRole(['EMPLOYEE', 'MANAGER', 'HR', 'ADMIN']),
  validate(clockInSchema),
  async (req, res, next) => {
    try {
      const result = await service.clockIn(req.user!.id, req.body);
      return res.status(201).json({ success: true, data: result });
    } catch (err) {
      return next(err);
    }
  }
);

router.post(
  '/clock-out',
  authenticate,
  requireRole(['EMPLOYEE', 'MANAGER', 'HR', 'ADMIN']),
  validate(clockOutSchema),
  async (req, res, next) => {
    try {
      const result = await service.clockOut(req.user!.id, req.body);
      return res.status(201).json({ success: true, data: result });
    } catch (err) {
      return next(err);
    }
  }
);

export { router as attendanceRouter };
