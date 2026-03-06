'use client';

import { useQuery } from '@tanstack/react-query';
import { Search, Users } from 'lucide-react';

import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { Input } from '@/components/ui/Input';
import { EmployeeProfileCard } from '@/components/hrm/EmployeeProfileCard';

type Employee = {
  id: string;
  fullName: string;
  email: string;
  role: string;
};

export function EmployeeDirectory(): React.ReactElement {
  const query = useQuery({
    queryKey: ['employees', 'list'],
    queryFn: async (): Promise<Employee[]> => {
      const res = await api.get('/employees?limit=20&offset=0');
      const dataUnknown: unknown = res.data;
      if (typeof dataUnknown !== 'object' || dataUnknown === null) return [];
      if (!('success' in dataUnknown) || !('data' in dataUnknown)) return [];

      const success = (dataUnknown as Record<string, unknown>).success;
      const data = (dataUnknown as Record<string, unknown>).data;
      if (success !== true) return [];
      if (!Array.isArray(data)) return [];

      return data
        .map((row): Employee | null => {
          if (typeof row !== 'object' || row === null) return null;
          const r = row as Record<string, unknown>;
          const id = r.id;
          const fullName = r.fullName;
          const email = r.email;
          const role = r.role;
          if (typeof id !== 'string') return null;
          if (typeof fullName !== 'string') return null;
          if (typeof email !== 'string') return null;
          if (typeof role !== 'string') return null;
          return { id, fullName, email, role };
        })
        .filter((e): e is Employee => e !== null);
    },
  });

  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-3">
            <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg text-violet-600 dark:text-violet-400">
              <Users size={24} />
            </div>
            Employee Directory
          </h1>
          <p className="mt-2 text-base text-zinc-500 dark:text-zinc-400 max-w-2xl">
            Manage your team members, view their roles, and track organizational structure across the company.
          </p>
        </div>
        <div className="relative w-full md:w-80 shadow-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input 
            placeholder="Search employees by name or email..." 
            className="pl-9 h-11 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 focus-visible:ring-violet-500 transition-all rounded-xl" 
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {query.isLoading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="overflow-hidden border-zinc-200 dark:border-zinc-800 shadow-sm rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-14 w-14 rounded-full" />
                  <div className="space-y-3 flex-1">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          (query.data ?? []).map((e: Employee) => (
            <EmployeeProfileCard key={e.id} employee={e} />
          ))
        )}
        
        {!query.isLoading && query.data?.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center p-16 text-center rounded-3xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/20 mt-4">
            <div className="h-16 w-16 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center mb-4 text-zinc-400">
              <Users size={32} />
            </div>
            <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">No employees found</h3>
            <p className="text-sm text-zinc-500 mt-2 max-w-sm">Get started by onboarding a new employee record through the HR dashboard.</p>
          </div>
        )}
      </div>
    </div>
  );
}
