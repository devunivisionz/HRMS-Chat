'use client';

import { useState } from 'react';

import { Header } from '@/components/hrm/Header';
import { MobileSidebar } from '@/components/hrm/MobileSidebar';
import { Sidebar, type SidebarNavItem } from '@/components/hrm/Sidebar';

export type AppShellProps = {
  children: React.ReactNode;
  sidebarItems: SidebarNavItem[];
  userEmail?: string | null;
  userRole?: 'ADMIN' | 'HR' | 'MANAGER' | 'EMPLOYEE' | null;
};

export function AppShell({ children, sidebarItems, userEmail, userRole }: AppShellProps): React.ReactElement {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <MobileSidebar items={sidebarItems} userRole={userRole} isOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <Sidebar items={sidebarItems} userRole={userRole} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header userEmail={userEmail} onMenuClick={() => setMobileOpen(true)} />

        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
