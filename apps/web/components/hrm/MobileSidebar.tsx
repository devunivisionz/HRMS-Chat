'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

export type SidebarNavItem = {
  href: string;
  label: string;
  roles?: readonly ('ADMIN' | 'HR' | 'MANAGER' | 'EMPLOYEE')[];
};

export type MobileSidebarProps = {
  items: SidebarNavItem[];
  userRole?: 'ADMIN' | 'HR' | 'MANAGER' | 'EMPLOYEE' | null | undefined;
  isOpen: boolean;
  onClose: () => void;
};

export function MobileSidebar({ items, userRole, isOpen, onClose }: MobileSidebarProps): React.ReactElement {
  const pathname = usePathname();

  const visibleItems = items.filter((i) => {
    if (!i.roles || i.roles.length === 0) return true;
    if (!userRole) return false;
    return i.roles.includes(userRole);
  });

  if (!isOpen) return <></>;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <aside className="absolute left-0 top-0 h-full w-64 bg-card p-4 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm font-semibold">Menu</span>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <nav className="flex flex-col gap-1">
          {visibleItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'rounded-md px-3 py-2 text-sm transition-colors',
                  isActive
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </div>
  );
}
