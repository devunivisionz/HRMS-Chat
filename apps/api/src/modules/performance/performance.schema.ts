import { z } from 'zod';

export const listGoalsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  employeeId: z.string().uuid().optional(),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
  quarter: z.coerce.number().int().min(1).max(4).optional(),
});

export type ListGoalsQuery = z.infer<typeof listGoalsSchema>;

export const createGoalSchema = z.object({
  employeeId: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  year: z.coerce.number().int().min(2000).max(2100),
  quarter: z.coerce.number().int().min(1).max(4),
  targetValue: z.string().max(100).optional(),
});

export type CreateGoalInput = z.infer<typeof createGoalSchema>;

export const rateGoalSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  actualValue: z.string().max(100).optional(),
});

export type RateGoalInput = z.infer<typeof rateGoalSchema>;
