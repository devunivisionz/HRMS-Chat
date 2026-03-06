import { prisma } from '@/lib/prisma';
import { AppError } from '@/lib/AppError';
import type { PaginatedResponse, Role } from '@hrms/types';

import type { ClockInInput, ClockOutInput, ListAttendanceQuery } from './attendance.schema';

type AttendanceRow = {
  id: string;
  employeeId: string;
  date: Date;
  clockIn: Date | null;
  clockOut: Date | null;
  totalHours: string | null;
  status: string;
  createdAt: Date;
};

export class AttendanceService {
  public async list(
    requester: { userId: string; role: Role },
    query: ListAttendanceQuery
  ): Promise<PaginatedResponse<AttendanceRow>> {
    const page = query.page;
    const limit = query.limit;

    const whereEmployeeId = query.employeeId ?? (requester.role === 'EMPLOYEE' ? requester.userId : undefined);

    if (query.employeeId && requester.role === 'EMPLOYEE' && query.employeeId !== requester.userId) {
      throw new AppError('FORBIDDEN', 403, 'Cannot view attendance for other employees');
    }

    const where: Record<string, unknown> = {};
    if (whereEmployeeId) where.employeeId = whereEmployeeId;

    if (query.month && query.year) {
      const from = new Date(Date.UTC(query.year, query.month - 1, 1));
      const to = new Date(Date.UTC(query.year, query.month, 1));
      where.date = { gte: from, lt: to };
    }

    const [data, total] = await Promise.all([
      prisma.attendance.findMany({
        where,
        select: {
          id: true,
          employeeId: true,
          date: true,
          clockIn: true,
          clockOut: true,
          totalHours: true,
          status: true,
          createdAt: true,
        },
        orderBy: { date: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.attendance.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  }

  public async clockIn(userId: string, input: ClockInInput): Promise<{ id: string }>{
    const at = input.at ? new Date(input.at) : new Date();

    const date = new Date(Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), at.getUTCDate()));

    const existing = await prisma.attendance.findUnique({
      where: { employeeId_date: { employeeId: userId, date } },
      select: { id: true, clockIn: true },
    });

    if (existing?.clockIn) throw new AppError('ALREADY_CLOCKED_IN', 400, 'Already clocked in');

    const row = await prisma.attendance.upsert({
      where: { employeeId_date: { employeeId: userId, date } },
      update: { clockIn: at },
      create: { employeeId: userId, date, clockIn: at, status: 'PRESENT' },
      select: { id: true },
    });

    return row;
  }

  public async clockOut(userId: string, input: ClockOutInput): Promise<{ id: string }>{
    const at = input.at ? new Date(input.at) : new Date();
    const date = new Date(Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), at.getUTCDate()));

    const existing = await prisma.attendance.findUnique({
      where: { employeeId_date: { employeeId: userId, date } },
      select: { id: true, clockIn: true, clockOut: true },
    });

    if (!existing?.clockIn) throw new AppError('NOT_CLOCKED_IN', 400, 'Clock-in required');
    if (existing.clockOut) throw new AppError('ALREADY_CLOCKED_OUT', 400, 'Already clocked out');

    const updated = await prisma.attendance.update({
      where: { id: existing.id },
      data: { clockOut: at },
      select: { id: true },
    });

    return updated;
  }
}
