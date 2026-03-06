import { prisma } from '@/lib/prisma';
import { AppError } from '@/lib/AppError';
import { notificationsQueue } from '@/lib/bull';
import type { PaginatedResponse, Role } from '@hrms/types';

import type { LeaveApprovalInput, LeaveRequestInput, ListLeavesQuery } from './leave.schema';

type LeaveRow = {
  id: string;
  employeeId: string;
  employee?: { fullName: string };
  leaveType?: { name: string };
  fromDate: Date;
  toDate: Date;
  days: string;
  status: string;
  reason: string | null;
  createdAt: Date;
};

export class LeaveService {
  public async list(
    requester: { userId: string; role: Role },
    query: ListLeavesQuery
  ): Promise<PaginatedResponse<LeaveRow>> {
    const page = query.page;
    const limit = query.limit;

    const where = requester.role === 'EMPLOYEE' ? { employeeId: requester.userId } : {};

    const [data, total] = await Promise.all([
      prisma.leaveRequest.findMany({
        where,
        select: {
          id: true,
          employeeId: true,
          employee: { select: { fullName: true } },
          leaveType: { select: { name: true } },
          fromDate: true,
          toDate: true,
          days: true,
          status: true,
          reason: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.leaveRequest.count({ where }),
    ]);

    return { data, meta: { total, page, limit, pages: Math.ceil(total / limit) } };
  }

  public async create(employeeId: string, input: LeaveRequestInput): Promise<{ id: string }> {
    const created = await prisma.$transaction(async (tx) => {
      const balance = await tx.leaveBalance.findFirst({
        where: { employeeId, leaveTypeId: input.leaveTypeId, year: new Date().getUTCFullYear() },
        select: { id: true, remaining: true },
      });

      if (!balance) throw new AppError('LEAVE_BALANCE_NOT_FOUND', 404);
      if (Number(balance.remaining) < input.days) {
        throw new AppError('INSUFFICIENT_LEAVE_BALANCE', 400, 'Insufficient leave balance');
      }

      const leave = await tx.leaveRequest.create({
        data: {
          employeeId,
          leaveTypeId: input.leaveTypeId,
          fromDate: new Date(input.fromDate),
          toDate: new Date(input.toDate),
          days: input.days,
          reason: input.reason,
        },
        select: { id: true },
      });

      return leave;
    });

    await notificationsQueue.add('in-app', {
      userId: employeeId,
      type: 'LEAVE_REQUEST_SUBMITTED',
      payload: { leaveId: created.id },
    });

    return created;
  }

  public async approve(
    id: string,
    approverId: string,
    input: LeaveApprovalInput
  ): Promise<{ id: string; status: string }> {
    const updated = await prisma.leaveRequest.update({
      where: { id },
      data: {
        status: input.status,
        approvedById: approverId,
        approvedAt: new Date(),
        remarks: input.remarks,
      },
      select: { id: true, status: true, employeeId: true },
    });

    await notificationsQueue.add('in-app', {
      userId: updated.employeeId,
      type: updated.status === 'APPROVED' ? 'LEAVE_APPROVED' : 'LEAVE_REJECTED',
      payload: { leaveId: updated.id },
    });

    return { id: updated.id, status: updated.status };
  }
}
