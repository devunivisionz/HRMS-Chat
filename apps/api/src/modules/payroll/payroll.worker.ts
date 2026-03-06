import { Worker } from 'bullmq';

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

type PayrollJobData = {
  monthYear: string;
  requestedBy: string;
};

function parseMonthStartIso(value: string): Date {
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) throw new Error('Invalid monthYear');
  return new Date(Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth(), 1));
}

export function startPayrollWorker(connection: { host: string; port: number; password?: string }): Worker {
  return new Worker(
    'payroll',
    async (job: unknown) => {
      if (typeof job !== 'object' || job === null) return;
      const j = job as { name?: unknown; data?: unknown };
      if (j.name !== 'calculate') return;

      const data = j.data as PayrollJobData;
      const monthStart = parseMonthStartIso(data.monthYear);

      const employees = await prisma.employee.findMany({
        where: { status: 'ACTIVE', deletedAt: null },
        select: { id: true },
      });

      await Promise.all(
        employees.map(async (e) => {
          await prisma.payrollRun.upsert({
            where: { employeeId_monthYear: { employeeId: e.id, monthYear: monthStart } },
            update: {},
            create: {
              employeeId: e.id,
              monthYear: monthStart,
              workingDays: 0,
              presentDays: 0,
              basicSalary: 0,
              allowances: {},
              grossPay: 0,
              deductions: {},
              netPay: 0,
              payslipUrl: null,
              isLocked: false,
              processedAt: new Date(),
              processedById: data.requestedBy,
            },
            select: { id: true },
          });
        })
      );
    },
    {
      connection,
      concurrency: 1,
    }
  ).on('failed', (job: unknown, err: unknown) => {
    const jobId =
      typeof job === 'object' && job !== null && 'id' in job && typeof (job as { id?: unknown }).id === 'string'
        ? (job as { id: string }).id
        : undefined;
    logger.error({ msg: 'payroll worker job failed', jobId, err });
  });
}
