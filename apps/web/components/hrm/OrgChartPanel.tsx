'use client';

import { useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api';
import { OrgChart } from '@/components/hrm/OrgChart';
import type { OrgChartNode } from '@/components/hrm/OrgChart';
import { Skeleton } from '@/components/ui/Skeleton';

type ApiEnvelope<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };

export function OrgChartPanel(): React.ReactElement {
  const query = useQuery({
    queryKey: ['employees', 'org-chart'],
    queryFn: async (): Promise<OrgChartNode | null> => {
      const res = await api.get('/employees/org-chart');
      const dataUnknown: unknown = res.data;
      if (typeof dataUnknown !== 'object' || dataUnknown === null) return null;
      const env = dataUnknown as ApiEnvelope<OrgChartNode>;
      if (!('success' in env) || env.success !== true) return null;
      return env.data;
    },
  });

  if (query.isLoading) {
    return <Skeleton className="h-40" />;
  }

  if (!query.data) {
    return <div className="text-sm text-muted-foreground">No org chart data.</div>;
  }

  return <OrgChart root={query.data} />;
}
