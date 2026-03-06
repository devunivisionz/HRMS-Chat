import { leaveApprovalInputSchema, leaveRequestInputSchema } from '@hrms/types';
import type { LeaveApprovalInput, LeaveRequestInput } from '@hrms/types';
import { z } from 'zod';

export const leaveRequestSchema = leaveRequestInputSchema;
export type { LeaveRequestInput };

export const leaveApprovalSchema = leaveApprovalInputSchema;
export type { LeaveApprovalInput };

export const listLeavesSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type ListLeavesQuery = z.infer<typeof listLeavesSchema>;
