import { z } from 'zod';
import { roleSchema, Role } from './common';

export const employeeStatusSchema = z.enum(['ACTIVE', 'INACTIVE', 'ON_NOTICE', 'TERMINATED']);
export type EmployeeStatus = z.infer<typeof employeeStatusSchema>;

export const createEmployeeInputSchema = z.object({
  empCode: z.string().min(1).max(30),
  fullName: z.string().min(1).max(120),
  email: z.string().email().max(255),
  phone: z.string().min(7).max(30).optional(),
  departmentId: z.string().uuid(),
  managerId: z.string().uuid().optional(),
  designation: z.string().min(1).max(120),
  joiningDate: z.string().datetime({ offset: true }),
  status: employeeStatusSchema.optional(),
  role: roleSchema.optional(),
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeInputSchema>;

export type Employee = {
  id: string;
  empCode: string;
  fullName: string;
  email: string;
  phone?: string;
  departmentId: string;
  managerId?: string;
  designation: string;
  joiningDate: string;
  role: Role;
  status: EmployeeStatus;
  createdAt: string;
  updatedAt: string;
};
