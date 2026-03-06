'use client';

import { useTheme } from 'next-themes';
import { Menu, Moon, Sun } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/Button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/DropdownMenu';
import { NotificationBell } from '@/components/hrm/NotificationBell';

export type HeaderProps = {
  userEmail?: string | null | undefined;
  onMenuClick?: () => void;
};

export function Header({ userEmail, onMenuClick }: HeaderProps): React.ReactElement {
  const { theme, setTheme } = useTheme();

  const toggleTheme = (): void => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-card px-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" className="md:hidden" onClick={onMenuClick} aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </Button>
        <span className="text-sm font-medium">HRMS</span>
      </div>
      <div className="flex items-center gap-2">
        <NotificationBell />

        <Button variant="ghost" size="sm" onClick={toggleTheme} aria-label="Toggle theme">
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              {userEmail ?? 'Account'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href="/me">Profile</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/logout">Sign out</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
