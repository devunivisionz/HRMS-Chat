import { prisma } from '@/lib/prisma';
import { AppError } from '@/lib/AppError';
import { payrollQueue } from '@/lib/bull';
import type { PaginatedResponse, Role } from '@hrms/types';

import type { ListPayrollQuery, RunPayrollInput } from './payroll.schema';

type PayrollRow = {
  id: string;
  employeeId: string;
  monthYear: Date;
  netPay: string;
  grossPay: string;
  payslipUrl: string | null;
  isLocked: boolean;
  createdAt: Date;
};

export class PayrollService {
  public async list(
    requester: { userId: string; role: Role },
    query: ListPayrollQuery
  ): Promise<PaginatedResponse<PayrollRow>> {
    const page = query.page;
    const limit = query.limit;

    const employeeId =
      requester.role === 'EMPLOYEE'
        ? requester.userId
        : query.employeeId;

    if (query.employeeId && requester.role === 'EMPLOYEE' && query.employeeId !== requester.userId) {
      throw new AppError('FORBIDDEN', 403);
    }

    const where: Record<string, unknown> = {};
    if (employeeId) where.employeeId = employeeId;

    const [data, total] = await Promise.all([
      prisma.payrollRun.findMany({
        where,
        select: {
          id: true,
          employeeId: true,
          monthYear: true,
          netPay: true,
          grossPay: true,
          payslipUrl: true,
          isLocked: true,
          createdAt: true,
        },
        orderBy: { monthYear: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.payrollRun.count({ where }),
    ]);

    return { 
      data: data.map(pay => ({
        ...pay,
        grossPay: pay.grossPay?.toString() || '0',
        netPay: pay.netPay?.toString() || '0'
      })), 
      meta: { total, page, limit, pages: Math.ceil(total / limit) } 
    };
  }

  public async runPayroll(requesterId: string, input: RunPayrollInput): Promise<{ jobId: string }> {
    const dt = new Date(input.monthYear);
    const monthStart = new Date(Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth(), 1));

    const job = await payrollQueue.add('calculate', {
      monthYear: monthStart.toISOString(),
      requestedBy: requesterId,
    });

    return { jobId: job.id ?? '' };
  }

  public async lockRun(id: string): Promise<{ id: string }> {
    const existing = await prisma.payrollRun.findUnique({ where: { id }, select: { isLocked: true } });
    if (!existing) throw new AppError('NOT_FOUND', 404);
    if (existing.isLocked) throw new AppError('PAYROLL_ALREADY_LOCKED', 400);

    const updated = await prisma.payrollRun.update({ where: { id }, data: { isLocked: true }, select: { id: true } });
    return updated;
  }
}
