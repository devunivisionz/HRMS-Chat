'use client';

import { useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api';
import { LeaveBalanceCard } from '@/components/hrm/LeaveBalanceCard';
import { Skeleton } from '@/components/ui/Skeleton';

type ApiEnvelope<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };

type LeaveBalanceRow = {
  id: string;
  leaveTypeId: string;
  leaveTypeName: string;
  year: number;
  allocated: string;
  used: string;
  remaining: string;
};

export function LeaveBalancesPanel(): React.ReactElement {
  const query = useQuery({
    queryKey: ['leaves', 'balances'],
    queryFn: async (): Promise<LeaveBalanceRow[]> => {
      const res = await api.get('/leaves/balances');
      const dataUnknown: unknown = res.data;
      if (typeof dataUnknown !== 'object' || dataUnknown === null) return [];
      const env = dataUnknown as ApiEnvelope<LeaveBalanceRow[]>;
      if (!('success' in env) || env.success !== true) return [];
      return env.data;
    },
  });

  if (query.isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {(query.data ?? []).map((b: LeaveBalanceRow) => (
        <div key={b.id}>
          <LeaveBalanceCard
            typeName={b.leaveTypeName}
            allocated={Number(b.allocated)}
            used={Number(b.used)}
          />
        </div>
      ))}
    </div>
  );
}
