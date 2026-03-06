'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Clock, LogIn, LogOut, Timer } from 'lucide-react';
import { toast } from 'sonner';

import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';

type AttendanceStatus = 'clocked_out' | 'clocked_in';

type AttendanceClockWidgetState = {
  status: AttendanceStatus;
  clockedInAt?: string | null;
  todaySeconds: number;
};

function formatHhMm(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  return `${h.toString().padStart(2, '0')}h ${m.toString().padStart(2, '0')}m`;
}

export function AttendanceClockWidget(): React.ReactElement {
  const queryClient = useQueryClient();
  const [now, setNow] = useState<Date>(() => new Date());
  const [state, setState] = useState<AttendanceClockWidgetState>({
    status: 'clocked_out',
    clockedInAt: null,
    todaySeconds: 0,
  });

  // Try to fetch current state on mount
  useEffect(() => {
    // In a real app we would fetch the actual attendance status from API here
    // api.get('/attendance/status').then(res => setState(res.data));
  }, []);

  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(t);
  }, []);

  const clockInMutation = useMutation({
    mutationFn: async (): Promise<void> => {
      await api.post('/attendance/clock-in', {});
    },
    onSuccess: () => {
      setState((s: AttendanceClockWidgetState) => ({
        ...s,
        status: 'clocked_in',
        clockedInAt: new Date().toISOString(),
      }));
      toast.success('Successfully clocked in. Have a great shift!');
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
    onError: () => {
      toast.error('Failed to clock in. Please try again.');
    }
  });

  const clockOutMutation = useMutation({
    mutationFn: async (): Promise<void> => {
      await api.post('/attendance/clock-out', {});
    },
    onSuccess: () => {
      setState((s: AttendanceClockWidgetState) => ({ ...s, status: 'clocked_out', clockedInAt: null }));
      toast.success('Successfully clocked out. Good work today!');
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
    onError: () => {
      toast.error('Failed to clock out. Please try again.');
    }
  });

  const isBusy = clockInMutation.isPending || clockOutMutation.isPending;

  const liveTodaySeconds = useMemo(() => {
    if (state.status !== 'clocked_in' || !state.clockedInAt) return state.todaySeconds;
    const started = new Date(state.clockedInAt).getTime();
    const delta = Math.max(0, Math.floor((now.getTime() - started) / 1000));
    return state.todaySeconds + delta;
  }, [now, state.clockedInAt, state.status, state.todaySeconds]);

  const onClockAction = async (): Promise<void> => {
    if (state.status === 'clocked_out') {
      await clockInMutation.mutateAsync();
      return;
    }
    await clockOutMutation.mutateAsync();
  };

  const isClockedIn = state.status === 'clocked_in';

  return (
    <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm rounded-2xl bg-white dark:bg-zinc-950/50 overflow-hidden relative">
      {/* Dynamic background accent based on status */}
      <div 
        className={`absolute top-0 left-0 w-full h-1 ${
          isClockedIn ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-700'
        } transition-colors duration-500`} 
      />
      
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${
            isClockedIn 
              ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' 
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
          } transition-colors duration-300`}>
            <Clock size={20} />
          </div>
          <div>
            <CardTitle className="text-xl">Time Clock</CardTitle>
            <CardDescription>Track your daily attendance</CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex flex-col gap-6 pt-4">
        <div className="flex flex-col items-center justify-center p-6 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 relative overflow-hidden group">
          
          {/* subtle pulse effect when clocked in */}
          {isClockedIn && (
            <div className="absolute inset-0 border-2 border-emerald-500/20 rounded-2xl animate-pulse pointer-events-none" />
          )}

          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1 tracking-wider uppercase">Current Time</p>
          <p className="text-5xl md:text-6xl font-black tracking-tight tabular-nums text-zinc-900 dark:text-zinc-100">
            {now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
            <span className="text-2xl md:text-3xl font-medium text-zinc-400 dark:text-zinc-500 ml-2">
              {now.toLocaleTimeString(undefined, { second: '2-digit' })}
            </span>
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
            {now.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col items-center justify-center p-4 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl">
            <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 mb-2">
              <span className="relative flex h-3 w-3">
                {isClockedIn && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
                <span className={`relative inline-flex rounded-full h-3 w-3 ${isClockedIn ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-600'}`}></span>
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider">Status</span>
            </div>
            <p className={`text-lg font-bold ${isClockedIn ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-700 dark:text-zinc-300'}`}>
              {isClockedIn ? 'Clocked In' : 'Clocked Out'}
            </p>
          </div>
          
          <div className="flex flex-col items-center justify-center p-4 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl">
            <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 mb-2">
              <Timer size={14} />
              <span className="text-xs font-semibold uppercase tracking-wider">Today</span>
            </div>
            <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
              {formatHhMm(liveTodaySeconds)}
            </p>
          </div>
        </div>

        <Button 
          onClick={onClockAction} 
          disabled={isBusy}
          className={`w-full h-14 text-base font-bold transition-all shadow-md hover:shadow-lg ${
            isClockedIn 
              ? 'bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-950' 
              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
          }`}
        >
          {isBusy ? (
            <span className="inline-flex items-center gap-3">
              <Spinner size="md" className="text-current" /> {isClockedIn ? 'Clocking Out...' : 'Clocking In...'}
            </span>
          ) : isClockedIn ? (
            <span className="flex items-center gap-2">
              <LogOut size={18} /> Clock Out Now
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <LogIn size={18} /> Clock In Now
            </span>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
