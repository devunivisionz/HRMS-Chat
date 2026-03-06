'use client';

import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';

export type EmployeeProfileCardProps = {
  employee: {
    id: string;
    fullName: string;
    email: string;
    role: string;
  };
};

export function EmployeeProfileCard({ employee }: EmployeeProfileCardProps): React.ReactElement {
  return (
    <Card className="group relative overflow-hidden rounded-2xl border-zinc-200 dark:border-zinc-800 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-violet-300 dark:hover:border-violet-700 bg-white dark:bg-zinc-950/50">
      <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none" />
      <CardContent className="flex items-center gap-4 p-5">
        <div className="relative">
          <Avatar alt={employee.fullName} fallback={employee.fullName} size="md" className="ring-2 ring-white dark:ring-zinc-950 shadow-sm h-14 w-14" />
          <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white dark:border-zinc-950 bg-emerald-500" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-base font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">{employee.fullName}</p>
            <Badge variant="secondary" className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
              {employee.role}
            </Badge>
          </div>
          <p className="truncate text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">{employee.email}</p>
        </div>
      </CardContent>
    </Card>
  );
}
