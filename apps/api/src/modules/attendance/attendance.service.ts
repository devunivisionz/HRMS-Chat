import { prisma } from '@/lib/prisma';
import { AppError } from '@/lib/AppError';
import type { PaginatedResponse, Role } from '@hrms/types';

import type { ClockInInput, ClockOutInput, ListAttendanceQuery, DailyAttendanceQuery } from './attendance.schema';

type DailyStatusRow = {
  employeeId: string;
  fullName: string;
  department: string;
  status: 'PRESENT' | 'WFH' | 'HALF_DAY' | 'ON_LEAVE' | 'ABSENT' | 'WEEKEND';
  clockIn: Date | null;
  clockOut: Date | null;
  leaveType: string | null;
};
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
      data: data.map(att => ({
        ...att,
        totalHours: att.totalHours?.toString() || '0'
      })),
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

  public async daily(
    requester: { userId: string; role: Role },
    query: DailyAttendanceQuery
  ): Promise<DailyStatusRow[]> {
    if (requester.role === 'EMPLOYEE') {
      throw new AppError('FORBIDDEN', 403, 'Requires managerial access');
    }

    const targetDateStr = query.date ? new Date(query.date) : new Date();
    // Normalize to start of day in UTC to match prisma
    const targetDate = new Date(Date.UTC(targetDateStr.getUTCFullYear(), targetDateStr.getUTCMonth(), targetDateStr.getUTCDate()));

    // 1. Get all employees (active, on notice)
    const employees = await prisma.employee.findMany({
      where: {
        status: { in: ['ACTIVE', 'ON_NOTICE'] },
      },
      select: {
        id: true,
        fullName: true,
        department: { select: { name: true } },
      },
      orderBy: { fullName: 'asc' }
    });

    // 2. Get attendance records for this date
    const attendanceRecords = await prisma.attendance.findMany({
      where: { date: targetDate },
      select: { employeeId: true, status: true, clockIn: true, clockOut: true },
    });
    const attMap = new Map(attendanceRecords.map(a => [a.employeeId, a]));

    // 3. Get approved leave records overlapping this date
    const leaves = await prisma.leaveRequest.findMany({
      where: {
        status: 'APPROVED',
        fromDate: { lte: targetDate },
        toDate: { gte: targetDate },
      },
      select: { employeeId: true, leaveType: { select: { name: true } } },
    });
    const leaveMap = new Map(leaves.map(l => [l.employeeId, l]));

    const isWeekend = targetDate.getUTCDay() === 0 || targetDate.getUTCDay() === 6;

    // 4. Map everything together
    const results: DailyStatusRow[] = employees.map((emp) => {
      const att = attMap.get(emp.id);
      const leave = leaveMap.get(emp.id);

      let status: DailyStatusRow['status'] = 'ABSENT';
      
      if (att) {
        status = att.status as DailyStatusRow['status'];
      } else if (leave) {
        status = 'ON_LEAVE';
      } else if (isWeekend) {
        status = 'WEEKEND';
      }

      return {
        employeeId: emp.id,
        fullName: emp.fullName,
        department: emp.department.name,
        status,
        clockIn: att?.clockIn || null,
        clockOut: att?.clockOut || null,
        leaveType: leave?.leaveType.name || null,
      };
    });

    return results;
  }
}
