'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/utils';

export type SidebarNavItem = {
  href: string;
  label: string;
  roles?: readonly ('ADMIN' | 'HR' | 'MANAGER' | 'EMPLOYEE')[];
};

export type SidebarProps = {
  items: SidebarNavItem[];
  userRole?: 'ADMIN' | 'HR' | 'MANAGER' | 'EMPLOYEE' | null | undefined;
};

export function Sidebar({ items, userRole }: SidebarProps): React.ReactElement {
  const pathname = usePathname();

  const visibleItems = items.filter((i) => {
    if (!i.roles || i.roles.length === 0) return true;
    if (!userRole) return false;
    return i.roles.includes(userRole);
  });

  return (
    <aside className="hidden w-64 border-r border-border bg-card p-4 md:block">
      <nav className="flex flex-col gap-1">
        {visibleItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'rounded-md px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-muted text-foreground dark:bg-muted dark:text-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground dark:text-muted-foreground dark:hover:bg-muted dark:hover:text-foreground'
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
