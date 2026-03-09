import { z } from 'zod';

export const leaveStatusSchema = z.enum(['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED']);
export type LeaveStatus = z.infer<typeof leaveStatusSchema>;

export const leaveRequestInputSchema = z
  .object({
    leaveTypeId: z.string().uuid(),
    fromDate: z.string().datetime({ offset: true }),
    toDate: z.string().datetime({ offset: true }),
    days: z.number().positive().max(365),
    reason: z.string().max(500).optional(),
  })
  .refine((data) => new Date(data.toDate) >= new Date(data.fromDate), {
    message: 'toDate must be after fromDate',
    path: ['toDate'],
  });

export type LeaveRequestInput = z.infer<typeof leaveRequestInputSchema>;

export const leaveApprovalInputSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  remarks: z.string().max(300).optional(),
});
export type LeaveApprovalInput = z.infer<typeof leaveApprovalInputSchema>;

export type LeaveRequest = {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  fromDate: string;
  toDate: string;
  days: string;
  reason?: string;
  status: LeaveStatus;
  approvedById?: string;
  approvedAt?: string;
  createdAt: string;
};

export type LeaveBalance = {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  year: number;
  allotted: string;
  used: string;
  remaining: string;
  managerId?: string;
};
