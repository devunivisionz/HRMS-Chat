import { Router } from 'express';

import { authenticate } from '@/middleware/auth.middleware';
import { requireRole } from '@/middleware/rbac.middleware';
import { validate } from '@/middleware/validate.middleware';

import {
  createApplicantSchema,
  createJobPostingSchema,
  listApplicantsSchema,
  listJobPostingsSchema,
  updateApplicantStageSchema,
} from './recruitment.schema';
import { RecruitmentService } from './recruitment.service';

const router = Router();
const service = new RecruitmentService();

router.get('/jobs', authenticate, requireRole(['EMPLOYEE', 'MANAGER', 'HR', 'ADMIN']), async (req, res, next) => {
  try {
    const query = listJobPostingsSchema.parse(req.query);
    const result = await service.listJobPostings(query);
    return res.json({ success: true, data: result });
  } catch (err) {
    return next(err);
  }
});

router.post('/jobs', authenticate, requireRole(['HR', 'ADMIN']), validate(createJobPostingSchema), async (req, res, next) => {
  try {
    const created = await service.createJobPosting({ userId: req.user!.id, role: req.user!.role }, req.body);
    return res.status(201).json({ success: true, data: created });
  } catch (err) {
    return next(err);
  }
});

router.get('/jobs/:jobPostingId/applicants', authenticate, requireRole(['HR', 'ADMIN']), async (req, res, next) => {
  try {
    const query = listApplicantsSchema.parse(req.query);
    const result = await service.listApplicants(String(req.params.jobPostingId), query);
    return res.json({ success: true, data: result });
  } catch (err) {
    return next(err);
  }
});

router.post('/applicants', authenticate, requireRole(['HR', 'ADMIN']), validate(createApplicantSchema), async (req, res, next) => {
  try {
    const created = await service.createApplicant(req.body);
    return res.status(201).json({ success: true, data: created });
  } catch (err) {
    return next(err);
  }
});

router.patch(
  '/applicants/:id/stage',
  authenticate,
  requireRole(['HR', 'ADMIN']),
  validate(updateApplicantStageSchema),
  async (req, res, next) => {
    try {
      const updated = await service.updateApplicantStage(
        String(req.params.id),
        { userId: req.user!.id, role: req.user!.role },
        req.body
      );
      return res.json({ success: true, data: updated });
    } catch (err) {
      return next(err);
    }
  }
);

export { router as recruitmentRouter };
