import { z } from 'zod';

export const listAttendanceSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
  employeeId: z.string().uuid().optional(),
});

export type ListAttendanceQuery = z.infer<typeof listAttendanceSchema>;

export const clockInSchema = z.object({
  at: z.string().datetime({ offset: true }).optional(),
});

export type ClockInInput = z.infer<typeof clockInSchema>;

export const clockOutSchema = z.object({
  at: z.string().datetime({ offset: true }).optional(),
});

export type ClockOutInput = z.infer<typeof clockOutSchema>;

export const dailyAttendanceSchema = z.object({
  date: z.string().datetime({ offset: true }).optional(),
});

export type DailyAttendanceQuery = z.infer<typeof dailyAttendanceSchema>;
