import { z } from 'zod';

export const listPayrollSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  employeeId: z.string().uuid().optional(),
});

export type ListPayrollQuery = z.infer<typeof listPayrollSchema>;

export const runPayrollSchema = z.object({
  monthYear: z.string().datetime({ offset: true }),
});

export type RunPayrollInput = z.infer<typeof runPayrollSchema>;
