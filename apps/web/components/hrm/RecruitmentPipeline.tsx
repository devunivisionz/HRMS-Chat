'use client';

import { useQuery } from '@tanstack/react-query';
import { Briefcase, Building, ChevronRight } from 'lucide-react';

import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';

type Job = {
  id: string;
  title: string;
  status: 'OPEN' | 'CLOSED';
};

export function RecruitmentPipeline(): React.ReactElement {
  const query = useQuery({
    queryKey: ['recruitment', 'jobs'],
    queryFn: async (): Promise<Job[]> => {
      const res = await api.get('/recruitment/jobs?limit=20&offset=0');
      const dataUnknown: unknown = res.data;
      if (typeof dataUnknown !== 'object' || dataUnknown === null) return [];
      const rec = dataUnknown as Record<string, unknown>;
      if (rec.success !== true) return [];
      const data = rec.data;
      if (!Array.isArray(data)) return [];
      return data as Job[];
    },
  });

  return (
    <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm rounded-2xl bg-white dark:bg-zinc-950/50">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
            <Briefcase size={20} />
          </div>
          <div>
            <CardTitle className="text-xl">Recruitment Pipeline</CardTitle>
            <CardDescription>Active job postings and hiring status</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {query.isLoading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between rounded-xl border border-zinc-100 dark:border-zinc-800/50 p-4">
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        ) : (query.data?.length === 0) ? (
          <div className="flex flex-col items-center justify-center py-10 text-center text-zinc-500 bg-zinc-50/50 dark:bg-zinc-900/20 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
            <div className="h-12 w-12 bg-white dark:bg-zinc-800 rounded-full flex items-center justify-center mb-3 shadow-sm border border-zinc-100 dark:border-zinc-700">
              <Building size={20} className="text-zinc-400" />
            </div>
            <p className="font-medium text-zinc-900 dark:text-zinc-100">No active job postings</p>
            <p className="text-sm mt-1 max-w-[200px]">There are currently no job openings in the pipeline.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {(query.data ?? []).map((j: Job) => (
              <div 
                key={j.id} 
                className="group flex items-center justify-between rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-blue-300 dark:hover:border-blue-700 bg-zinc-50/50 dark:bg-zinc-900/20 hover:bg-white dark:hover:bg-zinc-900 transition-all p-4 cursor-pointer shadow-sm hover:shadow-md"
              >
                <div className="flex flex-col gap-1">
                  <p className="text-base font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{j.title}</p>
                  <p className="text-xs text-zinc-500 font-medium">Job ID: {j.id.slice(0, 8)}</p>
                </div>
                <div className="flex items-center gap-4">
                  <Badge 
                    variant={j.status === 'CLOSED' ? 'secondary' : 'default'}
                    className={`text-[10px] uppercase tracking-wider font-bold ${
                      j.status === 'CLOSED' 
                        ? 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300' 
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400'
                    }`}
                  >
                    {j.status}
                  </Badge>
                  <ChevronRight size={16} className="text-zinc-400 group-hover:text-blue-500 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
