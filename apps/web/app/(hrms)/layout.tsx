import { redirect } from 'next/navigation';

import { createSupabaseServerClient } from '@/lib/supabase-server';
import { api } from '@/lib/api';
import { AppShell } from '@/components/hrm/AppShell';

const roleValues = ['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'] as const;
type Role = (typeof roleValues)[number];

export default async function HrmsLayout({
  children,
}: {
  children: React.ReactNode;
}): Promise<React.ReactElement> {
  const supabase = createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect('/login');
  }

  const email = userData.user.email ?? '';
  const quickRole: string | undefined = (userData.user.app_metadata as Record<string, unknown> | undefined)?.role as string | undefined;

  let role: 'ADMIN' | 'HR' | 'MANAGER' | 'EMPLOYEE' = 'EMPLOYEE';

  if (quickRole === 'ADMIN' || quickRole === 'HR' || quickRole === 'MANAGER' || quickRole === 'EMPLOYEE') {
    role = quickRole;
  }

  try {
    const res = await api.get('/employees/me');
    const payload: unknown = res.data;
    if (
      typeof payload === 'object' &&
      payload !== null &&
      (payload as Record<string, unknown>).success === true
    ) {
      const data = (payload as Record<string, unknown>).data as Record<string, unknown> | undefined;
      const dbRole = data?.role;
      if (dbRole === 'ADMIN' || dbRole === 'HR' || dbRole === 'MANAGER' || dbRole === 'EMPLOYEE') {
        role = dbRole;
      }
    }
  } catch {
    // keep quickRole as fallback
  }

  const sidebarItems: Array<{ href: string; label: string; roles?: readonly Role[] }> = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/employees', label: 'Employees', roles: ['ADMIN', 'HR', 'MANAGER'] as const },
    { href: '/attendance', label: 'Attendance' },
    { href: '/leaves', label: 'Leaves' },
    { href: '/payroll', label: 'Payroll', roles: ['ADMIN', 'HR'] as const },
    { href: '/performance', label: 'Performance' },
    { href: '/recruitment', label: 'Recruitment', roles: ['ADMIN', 'HR', 'MANAGER'] as const },
  ];

  return (
    <AppShell
      sidebarItems={sidebarItems}
      userEmail={email}
      userRole={role}
    >
      {children}
    </AppShell>
  );
}
