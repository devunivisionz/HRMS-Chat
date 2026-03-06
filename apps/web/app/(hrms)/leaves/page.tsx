import { LeaveRequestForm } from '@/components/hrm/LeaveRequestForm';
import { LeaveCalendar } from '@/components/hrm/LeaveCalendar';
import { LeaveBalancesPanel } from '@/components/hrm/LeaveBalancesPanel';

export default function LeavesPage(): React.ReactElement {
  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 mb-1">Leaves & Absences</h1>
        <p className="text-base text-zinc-500 dark:text-zinc-400">Request time off, check balances, and view team availability</p>
      </div>

      <div className="mb-2">
        <LeaveBalancesPanel />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <LeaveCalendar />
        </div>
        <div className="xl:col-span-1">
          <LeaveRequestForm />
        </div>
      </div>
    </div>
  );
}
