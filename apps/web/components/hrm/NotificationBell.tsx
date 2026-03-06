'use client';

import { Bell } from 'lucide-react';

import { useNotifications } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/Button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/DropdownMenu';

export function NotificationBell(): React.ReactElement {
  const { unreadCount, markAllRead } = useNotifications();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" aria-label="Notifications">
          <span className="relative">
            <Bell className="h-4 w-4" />
            {unreadCount > 0 ? (
              <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-destructive" />
            ) : null}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => void markAllRead()}>Mark all read</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
