import { prisma } from '@/lib/prisma';
import type { PaginatedResponse, Role } from '@hrms/types';
import { AppError } from '@/lib/AppError';
import type { CreateEmployeeInput } from './employee.schema';

export class EmployeeService {
  public async listEmployees(query: Record<string, unknown>): Promise<PaginatedResponse<{ id: string; empCode: string; fullName: string; email: string; role: Role }>> {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 20);

    const [data, total] = await Promise.all([
      prisma.employee.findMany({
        select: { id: true, empCode: true, fullName: true, email: true, role: true },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.employee.count(),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  public async getMe(email: string): Promise<{ id: string; empCode: string; fullName: string; email: string; role: Role }>{
    const employee = await prisma.employee.findFirst({
      where: { email },
      select: { id: true, empCode: true, fullName: true, email: true, role: true },
    });

    if (!employee) throw new AppError('NOT_FOUND', 404, 'Employee not found');

    return employee;
  }

  public async createEmployee(input: CreateEmployeeInput): Promise<{ id: string }> {
    const existing = await prisma.employee.findFirst({
      where: { OR: [{ empCode: input.empCode }, { email: input.email }] },
      select: { id: true },
    });

    if (existing) throw new AppError('DUPLICATE_ENTRY', 409, 'Employee already exists');

    const created = await prisma.employee.create({
      data: {
        empCode: input.empCode,
        fullName: input.fullName,
        email: input.email,
        phone: input.phone,
        departmentId: input.departmentId,
        managerId: input.managerId,
        designation: input.designation,
        joiningDate: new Date(input.joiningDate),
        status: input.status ?? 'ACTIVE',
      },
      select: { id: true },
    });

    return created;
  }
}
