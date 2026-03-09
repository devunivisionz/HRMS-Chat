'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Calendar, CheckCircle2, Home, Clock, Ban, Users, Coffee } from 'lucide-react';

import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';

type DailyStatusRow = {
  employeeId: string;
  fullName: string;
  department: string;
  status: 'PRESENT' | 'WFH' | 'HALF_DAY' | 'ON_LEAVE' | 'ABSENT' | 'WEEKEND';
  clockIn: string | null;
  clockOut: string | null;
  leaveType: string | null;
};

export function DailyTeamPresence(): React.ReactElement {
  const [selectedDate, setSelectedDate] = useState(() => new Date());

  const query = useQuery({
    queryKey: ['attendance', 'daily', selectedDate.toISOString()],
    queryFn: async (): Promise<DailyStatusRow[]> => {
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      const res = await api.get(`/attendance/daily?date=${formattedDate}`);
      
      const dataUnknown: unknown = res.data;
      if (typeof dataUnknown !== 'object' || dataUnknown === null) return [];
      const rec = dataUnknown as Record<string, unknown>;
      if (rec.success !== true) return [];
      
      return Array.isArray(rec.data) ? rec.data as DailyStatusRow[] : [];
    },
  });

  const getStatusBadge = (status: string, leaveType: string | null) => {
    switch (status) {
      case 'PRESENT':
        return <Badge variant="default" className="bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-200/50 hover:bg-emerald-500/20"><CheckCircle2 size={12} className="mr-1"/> Present</Badge>;
      case 'WFH':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 border-blue-200/50 hover:bg-blue-500/20"><Home size={12} className="mr-1"/> WFH</Badge>;
      case 'HALF_DAY':
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 border-amber-200/50 hover:bg-amber-500/20"><Clock size={12} className="mr-1"/> Half Day</Badge>;
      case 'ON_LEAVE':
        return <Badge variant="secondary" className="bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400 border-purple-200/50 hover:bg-purple-500/20" title={leaveType || 'Leave'}><Coffee size={12} className="mr-1"/> On Leave</Badge>;
      case 'ABSENT':
        return <Badge variant="destructive" className="bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 border-rose-200/50 hover:bg-rose-500/20"><Ban size={12} className="mr-1"/> Absent</Badge>;
      case 'WEEKEND':
        return <Badge variant="outline" className="bg-zinc-500/10 text-zinc-600 dark:bg-zinc-500/20 dark:text-zinc-400 border-zinc-200/50 hover:bg-zinc-500/20">Weekend</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStats = (data: DailyStatusRow[]) => {
    return {
      total: data.length,
      present: data.filter(d => ['PRESENT', 'WFH', 'HALF_DAY'].includes(d.status)).length,
      onLeave: data.filter(d => d.status === 'ON_LEAVE').length,
      absent: data.filter(d => d.status === 'ABSENT').length,
    };
  };

  const stats = getStats(query.data ?? []);

  return (
    <Card className="border-0 shadow-lg shadow-zinc-200/40 dark:shadow-black/20 rounded-3xl overflow-hidden bg-white/60 dark:bg-zinc-950/40 backdrop-blur-xl">
      <CardHeader className="border-b border-zinc-100 dark:border-zinc-800/60 bg-white/50 dark:bg-zinc-900/50 pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <Users size={20} />
              </div>
              Team Presence
            </CardTitle>
            <CardDescription className="mt-1">
              Daily overview of employee attendance and leaves
            </CardDescription>
          </div>
          <div className="flex items-center gap-3 bg-zinc-100/80 dark:bg-zinc-800/80 p-1.5 rounded-lg border border-zinc-200/50 dark:border-zinc-700/50">
            <Calendar size={16} className="text-zinc-500 ml-2" />
            <input 
              type="date" 
              className="bg-transparent border-none text-sm font-medium focus:ring-0 text-zinc-700 dark:text-zinc-300 w-32 cursor-pointer"
              value={format(selectedDate, 'yyyy-MM-dd')}
              onChange={(e) => {
                if(e.target.value) setSelectedDate(new Date(e.target.value));
              }}
            />
          </div>
        </div>
        
        {!query.isLoading && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-zinc-100 dark:border-zinc-800 shadow-sm flex flex-col">
              <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Total Team</span>
              <span className="text-2xl font-bold mt-1 text-zinc-900 dark:text-zinc-100">{stats.total}</span>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-xl p-4 border border-emerald-100 dark:border-emerald-900/50 shadow-sm flex flex-col">
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Working Today</span>
              <span className="text-2xl font-bold mt-1 text-emerald-700 dark:text-emerald-300">{stats.present}</span>
            </div>
            <div className="bg-purple-50 dark:bg-purple-950/30 rounded-xl p-4 border border-purple-100 dark:border-purple-900/50 shadow-sm flex flex-col">
              <span className="text-xs font-medium text-purple-600 dark:text-purple-400 uppercase tracking-wider">On Leave</span>
              <span className="text-2xl font-bold mt-1 text-purple-700 dark:text-purple-300">{stats.onLeave}</span>
            </div>
            <div className="bg-rose-50 dark:bg-rose-950/30 rounded-xl p-4 border border-rose-100 dark:border-rose-900/50 shadow-sm flex flex-col">
              <span className="text-xs font-medium text-rose-600 dark:text-rose-400 uppercase tracking-wider">Absent</span>
              <span className="text-2xl font-bold mt-1 text-rose-700 dark:text-rose-300">{stats.absent}</span>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent className="p-0">
        {query.isLoading ? (
          <div className="p-6 flex flex-col gap-3">
            {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
          </div>
        ) : query.data?.length === 0 ? (
          <div className="p-12 text-center text-zinc-500">
            No employee data found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-zinc-50/50 dark:bg-zinc-900/20">
                <TableRow className="border-zinc-100 dark:border-zinc-800/60 hover:bg-transparent">
                  <TableHead className="font-semibold text-zinc-500">Employee</TableHead>
                  <TableHead className="font-semibold text-zinc-500">Department</TableHead>
                  <TableHead className="font-semibold text-zinc-500 text-center">Status</TableHead>
                  <TableHead className="font-semibold text-zinc-500 text-right">Clock In</TableHead>
                  <TableHead className="font-semibold text-zinc-500 text-right">Clock Out</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {query.data?.map((row) => (
                  <TableRow key={row.employeeId} className="border-zinc-100 dark:border-zinc-800/60 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-colors">
                    <TableCell className="font-medium text-zinc-900 dark:text-zinc-100">
                      {row.fullName}
                      {row.leaveType && row.status === 'ON_LEAVE' && (
                        <span className="block text-xs font-normal text-zinc-500 mt-0.5">{row.leaveType}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-zinc-600 dark:text-zinc-400">{row.department}</TableCell>
                    <TableCell className="text-center">
                      {getStatusBadge(row.status, row.leaveType)}
                    </TableCell>
                    <TableCell className="text-right text-zinc-600 dark:text-zinc-400 font-mono text-sm">
                      {row.clockIn ? format(new Date(row.clockIn), 'HH:mm') : '--:--'}
                    </TableCell>
                    <TableCell className="text-right text-zinc-600 dark:text-zinc-400 font-mono text-sm">
                      {row.clockOut ? format(new Date(row.clockOut), 'HH:mm') : '--:--'}
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
