import { prisma } from '@/lib/prisma';
import { AppError } from '@/lib/AppError';
import type { PaginatedResponse, Role } from '@hrms/types';

import type { CreateGoalInput, ListGoalsQuery, RateGoalInput } from './performance.schema';

type GoalRow = {
  id: string;
  employeeId: string;
  title: string;
  description: string | null;
  quarter: number;
  year: number;
  targetValue: string | null;
  actualValue: string | null;
  rating: number | null;
  reviewedById: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
};

export class PerformanceService {
  public async listGoals(
    requester: { userId: string; role: Role },
    query: ListGoalsQuery
  ): Promise<PaginatedResponse<GoalRow>> {
    const page = query.page;
    const limit = query.limit;

    const employeeId = requester.role === 'EMPLOYEE' ? requester.userId : query.employeeId;

    if (query.employeeId && requester.role === 'EMPLOYEE' && query.employeeId !== requester.userId) {
      throw new AppError('FORBIDDEN', 403);
    }

    const where: Record<string, unknown> = {};
    if (employeeId) where.employeeId = employeeId;
    if (query.year) where.year = query.year;
    if (query.quarter) where.quarter = query.quarter;

    const [data, total] = await Promise.all([
      prisma.performanceGoal.findMany({
        where,
        select: {
          id: true,
          employeeId: true,
          title: true,
          description: true,
          quarter: true,
          year: true,
          targetValue: true,
          actualValue: true,
          rating: true,
          reviewedById: true,
          reviewedAt: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.performanceGoal.count({ where }),
    ]);

    return { data, meta: { total, page, limit, pages: Math.ceil(total / limit) } };
  }

  public async createGoal(requester: { userId: string; role: Role }, input: CreateGoalInput): Promise<{ id: string }> {
    if (!['MANAGER', 'HR', 'ADMIN'].includes(requester.role)) {
      throw new AppError('FORBIDDEN', 403);
    }

    const created = await prisma.performanceGoal.create({
      data: {
        employeeId: input.employeeId,
        title: input.title,
        description: input.description,
        year: input.year,
        quarter: input.quarter,
        targetValue: input.targetValue,
      },
      select: { id: true },
    });

    return created;
  }

  public async rateGoal(
    goalId: string,
    requester: { userId: string; role: Role },
    input: RateGoalInput
  ): Promise<{ id: string }> {
    if (!['MANAGER', 'HR', 'ADMIN'].includes(requester.role)) {
      throw new AppError('FORBIDDEN', 403);
    }

    const existing = await prisma.performanceGoal.findUnique({ where: { id: goalId }, select: { id: true } });
    if (!existing) throw new AppError('NOT_FOUND', 404);

    const updated = await prisma.performanceGoal.update({
      where: { id: goalId },
      data: {
        rating: input.rating,
        actualValue: input.actualValue,
        reviewedById: requester.userId,
        reviewedAt: new Date(),
      },
      select: { id: true },
    });

    return updated;
  }
}
