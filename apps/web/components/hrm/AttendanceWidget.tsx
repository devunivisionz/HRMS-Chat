'use client';

import { useQuery } from '@tanstack/react-query';
import { CalendarDays, Clock3 } from 'lucide-react';
import { format } from 'date-fns';

import { api } from '@/lib/api';
import { AttendanceClockWidget } from '@/components/hrm/AttendanceClockWidget';
import { Skeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';

type AttendanceRow = {
  id: string;
  date: string;
  clockIn: string | null;
  clockOut: string | null;
  totalHours: string | null;
  status: string;
};

export function AttendanceWidget(): React.ReactElement {
  const query = useQuery({
    queryKey: ['attendance', 'recent'],
    queryFn: async (): Promise<AttendanceRow[]> => {
      const res = await api.get('/attendance?limit=5');
      const dataUnknown: unknown = res.data;
      if (typeof dataUnknown !== 'object' || dataUnknown === null) return [];
      const rec = dataUnknown as Record<string, unknown>;
      if (rec.success !== true) return [];
      const data = rec.data;
      if (!data || typeof data !== 'object' || !('data' in data)) return [];
      const list = (data as { data: unknown[] }).data;
      if (!Array.isArray(list)) return [];
      return list as AttendanceRow[];
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <AttendanceClockWidget />
      
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-2 mt-2">
          <CalendarDays size={16} /> Recent Activity
        </h3>
        
        {query.isLoading ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
        ) : query.data?.length === 0 ? (
          <div className="text-center py-6 text-sm text-zinc-500 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
            No recent attendance records found.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {(query.data ?? []).map((row) => (
              <div 
                key={row.id} 
                className="flex items-center justify-between p-3 bg-zinc-50/50 dark:bg-zinc-900/30 rounded-xl border border-zinc-100 dark:border-zinc-800/60"
              >
                <div>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100 text-sm">
                    {format(new Date(row.date), 'MMM d, yyyy')}
                  </p>
                  <p className="text-xs text-zinc-500 flex items-center gap-1 mt-1">
                    <Clock3 size={12} />
                    {row.clockIn ? format(new Date(row.clockIn), 'HH:mm') : '--:--'}
                    {' - '}
                    {row.clockOut ? format(new Date(row.clockOut), 'HH:mm') : '--:--'}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant={row.status === 'PRESENT' ? 'default' : 'secondary'} className="text-[10px] tracking-wider font-bold">
                    {row.status}
                  </Badge>
                  {row.totalHours && (
                    <span className="text-xs font-medium text-zinc-500">{row.totalHours} hrs</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
