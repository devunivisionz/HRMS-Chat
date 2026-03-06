'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
} from 'date-fns';

import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';

type LeaveRecord = {
  id: string;
  employeeId: string;
  employee?: { fullName: string };
  leaveType?: { name: string };
  fromDate: string;
  toDate: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  days: string;
};

export function LeaveCalendar(): React.ReactElement {
  const [currentDate, setCurrentDate] = useState(() => new Date());

  const query = useQuery({
    queryKey: ['leaves', 'all'],
    queryFn: async (): Promise<LeaveRecord[]> => {
      // NOTE: In a real app we would pass month/year to the API
      // Since the API uses pagination, we're fetching a larger limit to get the broad range
      const res = await api.get('/leaves?limit=100');
      const dataUnknown: unknown = res.data;
      if (typeof dataUnknown !== 'object' || dataUnknown === null) return [];
      const rec = dataUnknown as Record<string, unknown>;
      if (rec.success !== true) return [];
      const data = rec.data;
      if (!data || typeof data !== 'object' || !('data' in data)) return [];
      
      const list = (data as { data: unknown[] }).data;
      return Array.isArray(list) ? list as LeaveRecord[] : [];
    },
  });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  // Calendar math
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Start on Monday
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const getLeavesForDay = (day: Date, leaves: LeaveRecord[]) => {
    return leaves.filter(leave => {
      const from = new Date(leave.fromDate);
      from.setHours(0, 0, 0, 0);
      const to = new Date(leave.toDate);
      to.setHours(23, 59, 59, 999);
      return day >= from && day <= to;
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50';
      case 'PENDING':  return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 border-amber-200 dark:border-amber-800/50';
      case 'REJECTED': return 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400 border-rose-200 dark:border-rose-800/50';
      default:         return 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700';
    }
  };

  return (
    <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm rounded-2xl bg-white dark:bg-zinc-950/50 overflow-hidden col-span-1 lg:col-span-2">
      <CardHeader className="border-b border-zinc-100 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-900/20 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
              <CalendarIcon size={20} />
            </div>
            <CardTitle className="text-xl">Team Leave Calendar</CardTitle>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 w-32 text-center">
              {format(currentDate, 'MMMM yyyy')}
            </span>
            <div className="flex gap-1">
              <Button variant="outline" size="icon" className="h-8 w-8 rounded-full border-zinc-200 dark:border-zinc-800" onClick={prevMonth}>
                <ChevronLeft size={16} />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8 rounded-full border-zinc-200 dark:border-zinc-800" onClick={nextMonth}>
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="grid grid-cols-7 border-b border-zinc-100 dark:border-zinc-800/50 bg-zinc-50/80 dark:bg-zinc-900/40">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
            <div key={day} className="py-3 text-center text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>
        
        {query.isLoading ? (
          <div className="p-6 flex flex-col gap-4">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
        ) : (
          <div className="grid grid-cols-7 auto-rows-[minmax(120px,auto)] text-sm">
            {calendarDays.map((day, dayIdx) => {
              const isCurrentMonth = isSameMonth(day, currentDate);
              const dayLeaves = getLeavesForDay(day, query.data ?? []);
              
              return (
                <div 
                  key={day.toISOString()} 
                  className={`border-r border-b border-zinc-100 dark:border-zinc-800/50 p-2 relative transition-colors ${
                    isCurrentMonth 
                      ? 'bg-white dark:bg-zinc-950/20' 
                      : 'bg-zinc-50/50 dark:bg-zinc-900/20 text-zinc-400 dark:text-zinc-600'
                  } ${isSameDay(day, new Date()) ? 'bg-indigo-50/30 dark:bg-indigo-900/10' : 'hover:bg-zinc-50 dark:hover:bg-zinc-900/40'}`}
                >
                  <div className="flex justify-end mb-1">
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${
                      isSameDay(day, new Date()) 
                        ? 'bg-indigo-600 text-white shadow-sm' 
                        : isCurrentMonth ? 'text-zinc-700 dark:text-zinc-300' : ''
                    }`}>
                      {format(day, 'd')}
                    </span>
                  </div>
                  
                  <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[80px] no-scrollbar">
                    {dayLeaves.map(leave => (
                      <div 
                        key={leave.id}
                        className={`px-2 py-1 text-[10px] sm:text-xs rounded-md border flex flex-col gap-0.5 whitespace-nowrap overflow-hidden text-ellipsis shadow-sm ${getStatusColor(leave.status)}`}
                        title={`${leave.employee?.fullName || 'Employee'} - ${leave.leaveType?.name || 'Leave'} (${leave.status})`}
                      >
                        <span className="font-semibold truncate">
                          {leave.employee?.fullName || 'Employee'}
                        </span>
                        <div className="flex justify-between items-center opacity-80">
                          <span className="truncate max-w-[50px]">{leave.leaveType?.name || 'Leave'}</span>
                          <span className="text-[9px] uppercase tracking-tighter">{leave.status.slice(0, 3)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
