'use client';

import { Building2, Users } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/Card';
import { AttendanceWidget } from '@/components/hrm/AttendanceWidget';
import { NotificationBell } from '@/components/hrm/NotificationBell';

export function HrmsDashboard(): React.ReactElement {
  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
            Welcome back, admin 👋
          </h1>
          <p className="mt-2 text-base text-zinc-500 dark:text-zinc-400">
            Here's what's happening at your company today.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <NotificationBell />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Priority Items */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Quick Stats Cards */}
            <Card className="group relative overflow-hidden rounded-2xl border-zinc-200 dark:border-zinc-800 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-violet-300 dark:hover:border-violet-700 bg-white dark:bg-zinc-950/50">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none" />
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Total Employees</p>
                    <p className="mt-2 lg:text-4xl text-3xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">20</p>
                  </div>
                  <div className="p-3 bg-violet-100 dark:bg-violet-900/30 rounded-xl text-violet-600 dark:text-violet-400">
                    <Users size={24} />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <span className="text-emerald-500 font-medium">+2</span>
                  <span className="text-zinc-500 ml-2">from last month</span>
                </div>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden rounded-2xl border-zinc-200 dark:border-zinc-800 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-blue-300 dark:hover:border-blue-700 bg-white dark:bg-zinc-950/50">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none" />
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Open Roles</p>
                    <p className="mt-2 lg:text-4xl text-3xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">3</p>
                  </div>
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400">
                    <Building2 size={24} />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <span className="text-emerald-500 font-medium">Active hiring</span>
                  <span className="text-zinc-500 ml-2">across 2 departments</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-950/50 p-6 flex items-center justify-center text-zinc-500 text-sm h-48 border-dashed">
            <span>More dashboard widgets coming soon...</span>
          </div>
        </div>

        {/* Right Column - Interactions */}
        <div className="flex flex-col gap-6">
          <AttendanceWidget />
        </div>
      </div>
    </div>
  );
}
