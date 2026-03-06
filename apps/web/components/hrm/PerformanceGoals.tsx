'use client';

import { useQuery } from '@tanstack/react-query';
import { Target, Trophy } from 'lucide-react';

import { api } from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';

type Goal = {
  id: string;
  title: string;
  status: 'OPEN' | 'DONE';
  rating?: number | null;
};

export function PerformanceGoals(): React.ReactElement {
  const query = useQuery({
    queryKey: ['performance', 'goals'],
    queryFn: async (): Promise<Goal[]> => {
      const res = await api.get('/performance/goals?limit=20&offset=0');
      const dataUnknown: unknown = res.data;
      if (typeof dataUnknown !== 'object' || dataUnknown === null) return [];
      const rec = dataUnknown as Record<string, unknown>;
      if (rec.success !== true) return [];
      const data = rec.data;
      if (!Array.isArray(data)) return [];
      return data as Goal[];
    },
  });

  return (
    <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm rounded-2xl bg-white dark:bg-zinc-950/50 overflow-hidden">
      <CardHeader className="border-b border-zinc-100 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-900/20 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg text-orange-600 dark:text-orange-400">
            <Target size={20} />
          </div>
          <div>
            <CardTitle className="text-xl">Performance Goals</CardTitle>
            <CardDescription>Track individual and team objectives</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {query.isLoading ? (
          <div className="flex flex-col gap-0">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 border-b border-zinc-100 dark:border-zinc-800/50">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-6 w-16 rounded-full mx-auto" />
                <Skeleton className="h-4 w-8 ml-auto" />
              </div>
            ))}
          </div>
        ) : (query.data?.length === 0) ? (
          <div className="flex flex-col items-center justify-center p-12 text-center text-zinc-500">
            <div className="h-12 w-12 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-3">
              <Trophy size={24} className="text-zinc-400" />
            </div>
            <p className="font-medium text-zinc-900 dark:text-zinc-100">No active goals</p>
            <p className="text-sm">Create personal or team performance goals to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-zinc-50/50 dark:bg-zinc-900/20">
                <TableRow className="hover:bg-transparent border-zinc-100 dark:border-zinc-800/50">
                  <TableHead className="font-medium text-zinc-500 pl-6 w-full">Title</TableHead>
                  <TableHead className="font-medium text-zinc-500 text-center whitespace-nowrap">Status</TableHead>
                  <TableHead className="font-medium text-zinc-500 text-right pr-6 whitespace-nowrap">Rating</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(query.data ?? []).map((g: Goal) => (
                  <TableRow key={g.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20 border-zinc-100 dark:border-zinc-800/50 group transition-colors">
                    <TableCell className="font-medium text-zinc-900 dark:text-zinc-100 pl-6 py-4">
                      {g.title}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge 
                        variant={g.status === 'DONE' ? 'secondary' : 'default'}
                        className={`text-xs uppercase tracking-wider font-bold ${
                          g.status === 'DONE' 
                            ? 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300' 
                            : 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400 hover:bg-orange-200 dark:hover:bg-orange-900/60'
                        }`}
                      >
                        {g.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-6 font-semibold text-zinc-700 dark:text-zinc-300">
                      {typeof g.rating === 'number' ? (
                        <div className="flex items-center justify-end gap-1">
                          {g.rating.toFixed(1)}
                          <span className="text-xs text-zinc-400 font-normal">/5</span>
                        </div>
                      ) : (
                        <span className="text-zinc-400">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
