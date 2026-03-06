import { z } from 'zod';

export const listJobPostingsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});
export type ListJobPostingsQuery = z.infer<typeof listJobPostingsSchema>;

export const createJobPostingSchema = z.object({
  title: z.string().min(1).max(200),
  departmentId: z.string().uuid(),
  description: z.string().min(1).max(10_000),
  requirements: z.string().max(10_000).optional(),
});
export type CreateJobPostingInput = z.infer<typeof createJobPostingSchema>;

export const listApplicantsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  stage: z.enum(['APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'JOINED', 'REJECTED']).optional(),
});
export type ListApplicantsQuery = z.infer<typeof listApplicantsSchema>;

export const createApplicantSchema = z.object({
  jobPostingId: z.string().uuid(),
  fullName: z.string().min(1).max(200),
  email: z.string().email().max(255),
  phone: z.string().min(7).max(30).optional(),
  cvUrl: z.string().url().optional(),
});
export type CreateApplicantInput = z.infer<typeof createApplicantSchema>;

export const updateApplicantStageSchema = z.object({
  stage: z.enum(['APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'JOINED', 'REJECTED']),
  notes: z.string().max(10_000).optional(),
  assignedToId: z.string().uuid().optional(),
});
export type UpdateApplicantStageInput = z.infer<typeof updateApplicantStageSchema>;
