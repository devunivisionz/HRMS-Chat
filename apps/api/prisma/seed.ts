import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const departments = ['HR', 'Engineering', 'Sales'];

  await Promise.all(
    departments.map((name) =>
      prisma.department.upsert({
        where: { name },
        update: {},
        create: { name },
      })
    )
  );

  const leaveTypes = [
    { name: 'Annual', maxDaysPerYear: 18, isCarryForward: true, isPaid: true },
    { name: 'Sick', maxDaysPerYear: 10, isCarryForward: false, isPaid: true },
    { name: 'Casual', maxDaysPerYear: 7, isCarryForward: false, isPaid: true },
    { name: 'Unpaid', maxDaysPerYear: 365, isCarryForward: false, isPaid: false },
  ];

  await Promise.all(
    leaveTypes.map((lt) =>
      prisma.leaveType.upsert({
        where: { name: lt.name },
        update: {
          maxDaysPerYear: lt.maxDaysPerYear,
          isCarryForward: lt.isCarryForward,
          isPaid: lt.isPaid,
        },
        create: lt,
      })
    )
  );

  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@company.com';
  const adminId = process.env.SEED_ADMIN_ID ?? '00000000-0000-0000-0000-000000000001';

  await prisma.employee.upsert({
    where: { id: adminId },
    update: {
      email: adminEmail,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
    create: {
      id: adminId,
      empCode: 'ADM001',
      fullName: 'Admin User',
      email: adminEmail,
      departmentId: (await prisma.department.findFirst({ select: { id: true } }))!.id,
      designation: 'Administrator',
      joiningDate: new Date(),
      role: 'ADMIN',
      status: 'ACTIVE',
    },
    select: { id: true },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (err: unknown) => {
    // eslint-disable-next-line no-console
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
