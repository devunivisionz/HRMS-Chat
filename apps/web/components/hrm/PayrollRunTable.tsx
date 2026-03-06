'use client';

import { useQuery } from '@tanstack/react-query';
import { Banknote, FileTerminal, Search } from 'lucide-react';

import { api } from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';

type PayrollRun = {
  id: string;
  periodStart: string;
  periodEnd: string;
  status: 'DRAFT' | 'LOCKED';
  createdAt: string;
};

export function PayrollRunTable(): React.ReactElement {
  const query = useQuery({
    queryKey: ['payroll', 'runs'],
    queryFn: async (): Promise<PayrollRun[]> => {
      const res = await api.get('/payroll/runs?limit=20&offset=0');
      const dataUnknown: unknown = res.data;
      if (typeof dataUnknown !== 'object' || dataUnknown === null) return [];
      const rec = dataUnknown as Record<string, unknown>;
      if (rec.success !== true) return [];
      const data = rec.data;
      if (!Array.isArray(data)) return [];
      return data as PayrollRun[];
    },
  });

  return (
    <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm rounded-2xl bg-white dark:bg-zinc-950/50 overflow-hidden">
      <CardHeader className="border-b border-zinc-100 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-900/20 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">
              <Banknote size={20} />
            </div>
            <div>
              <CardTitle className="text-xl">Payroll Runs</CardTitle>
              <CardDescription>Recent and historical payroll processing records</CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {query.isLoading ? (
          <div className="flex flex-col gap-0">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 border-b border-zinc-100 dark:border-zinc-800/50">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-4 w-1/4 ml-auto" />
              </div>
            ))}
          </div>
        ) : (query.data?.length === 0) ? (
          <div className="flex flex-col items-center justify-center p-12 text-center text-zinc-500">
            <div className="h-12 w-12 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-3">
              <FileTerminal size={24} className="text-zinc-400" />
            </div>
            <p className="font-medium text-zinc-900 dark:text-zinc-100">No payroll runs found</p>
            <p className="text-sm">There are no payroll records for this period.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-zinc-50/50 dark:bg-zinc-900/20">
                <TableRow className="hover:bg-transparent border-zinc-100 dark:border-zinc-800/50">
                  <TableHead className="font-medium text-zinc-500 whitespace-nowrap pl-6">Period</TableHead>
                  <TableHead className="font-medium text-zinc-500 whitespace-nowrap">Status</TableHead>
                  <TableHead className="font-medium text-zinc-500 whitespace-nowrap text-right pr-6">Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(query.data ?? []).map((r: PayrollRun) => (
                  <TableRow key={r.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20 border-zinc-100 dark:border-zinc-800/50 group transition-colors">
                    <TableCell className="whitespace-nowrap font-medium text-zinc-900 dark:text-zinc-100 pl-6">
                      {new Date(r.periodStart).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} 
                      {' '}—{' '} 
                      {new Date(r.periodEnd).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={r.status === 'LOCKED' ? 'secondary' : 'default'}
                        className={`text-xs uppercase tracking-wider font-bold ${
                          r.status === 'LOCKED' 
                            ? 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300' 
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/60'
                        }`}
                      >
                        {r.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-zinc-500 text-right pr-6">
                      {new Date(r.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
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
