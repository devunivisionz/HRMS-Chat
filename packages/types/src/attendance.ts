import { z } from 'zod';

export const attendanceStatusSchema = z.enum(['PRESENT', 'ABSENT', 'HALF_DAY', 'WFH', 'ON_LEAVE']);
export type AttendanceStatus = z.infer<typeof attendanceStatusSchema>;

export const clockInInputSchema = z.object({
  at: z.string().datetime({ offset: true }).optional(),
});
export type ClockInInput = z.infer<typeof clockInInputSchema>;

export type Attendance = {
  id: string;
  employeeId: string;
  date: string;
  clockIn?: string;
  clockOut?: string;
  totalHours?: string;
  status: AttendanceStatus;
  createdAt: string;
};
