import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';

import type { Role } from '@hrms/types';

type LeaveBalanceRow = {
  id: string;
  leaveTypeId: string;
  leaveTypeName: string;
  year: number;
  allocated: string;
  used: string;
  remaining: string;
};

function cacheKey(userId: string, year: number): string {
  return `leave:balance:${userId}:${year}`;
}

export class LeaveBalanceService {
  public async getBalances(requester: { userId: string; role: Role }, employeeId: string, year: number): Promise<LeaveBalanceRow[]> {
    if (requester.role === 'EMPLOYEE' && employeeId !== requester.userId) {
      return [];
    }

    const key = cacheKey(employeeId, year);

    const cached = await redis.get(key);
    if (cached) {
      const parsed: unknown = JSON.parse(cached);
      if (Array.isArray(parsed)) {
        return parsed as LeaveBalanceRow[];
      }
    }

    const rows = await prisma.leaveBalance.findMany({
      where: { employeeId, year },
      select: {
        id: true,
        leaveTypeId: true,
        year: true,
        allocated: true,
        used: true,
        remaining: true,
        leaveType: { select: { name: true } },
      },
      orderBy: { leaveType: { name: 'asc' } },
    });

    const mapped: LeaveBalanceRow[] = rows.map((r) => ({
      id: r.id,
      leaveTypeId: r.leaveTypeId,
      leaveTypeName: r.leaveType.name,
      year: r.year,
      allocated: String(r.allocated),
      used: String(r.used),
      remaining: String(r.remaining),
    }));

    await redis.set(key, JSON.stringify(mapped), 'EX', 60);

    return mapped;
  }

  public async invalidate(employeeId: string, year: number): Promise<void> {
    await redis.del(cacheKey(employeeId, year));
  }
}
