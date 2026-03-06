import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';

import { AppError } from '@/lib/AppError';

type OrgChartNode = {
  id: string;
  name: string;
  title: string;
  reports: OrgChartNode[];
};

function cacheKey(): string {
  return 'orgchart:v1';
}

export class OrgChartService {
  public async getOrgChart(): Promise<OrgChartNode> {
    const key = cacheKey();

    const cached = await redis.get(key);
    if (cached) {
      const parsed: unknown = JSON.parse(cached);
      if (typeof parsed === 'object' && parsed !== null) {
        return parsed as OrgChartNode;
      }
    }

    const employees = await prisma.employee.findMany({
      where: { status: 'ACTIVE', deletedAt: null },
      select: {
        id: true,
        fullName: true,
        designation: true,
        managerId: true,
      },
      orderBy: { fullName: 'asc' },
    });

    const nodes = new Map<string, OrgChartNode>();
    for (const e of employees) {
      nodes.set(e.id, {
        id: e.id,
        name: e.fullName,
        title: e.designation,
        reports: [],
      });
    }

    let root: OrgChartNode | null = null;

    for (const e of employees) {
      const node = nodes.get(e.id);
      if (!node) continue;

      if (e.managerId) {
        const manager = nodes.get(e.managerId);
        if (manager) {
          manager.reports.push(node);
          continue;
        }
      }

      if (!root) root = node;
    }

    if (!root) throw new AppError('NOT_FOUND', 404, 'No employees found');

    await redis.set(key, JSON.stringify(root), 'EX', 300);
    return root;
  }

  public async invalidate(): Promise<void> {
    await redis.del(cacheKey());
  }
}
