import { AttendanceWidget } from '@/components/hrm/AttendanceWidget';
import { DailyTeamPresence } from '@/components/hrm/DailyTeamPresence';
import { createSupabaseServerClient } from '@/lib/supabase-server';

export default async function AttendancePage(): Promise<React.ReactElement> {
  const supabase = createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  // Custom claim injection for role
  // Need to fetch user record to get exact role since auth.users might lack it in metadata depending on sync
  const { data: profile } = await supabase
    .from('employees')
    .select('role')
    .eq('id', session?.user?.id)
    .single();

  const isManagerOrAbove = ['MANAGER', 'HR', 'ADMIN'].includes(profile?.role || '');

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 mb-1">Attendance</h1>
        <p className="text-base text-zinc-500 dark:text-zinc-400">Track your daily working hours and view team presence</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-1 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 bg-white dark:bg-zinc-950 mt-1">
          <AttendanceWidget />
        </div>
        
        {isManagerOrAbove && (
          <div className="xl:col-span-2">
            <DailyTeamPresence />
          </div>
        )}
      </div>
    </div>
  );
}
