'use client';

import Link from 'next/link';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export type ChannelListItem = {
  id: string;
  name: string;
  unreadCount?: number;
  isActive?: boolean;
  isDm?: boolean;
};

export type ChannelListProps = {
  items: ChannelListItem[];
};

export function ChannelList({ items }: ChannelListProps): React.ReactElement {
  return (
    <aside className="w-[280px] shrink-0 border-r border-border bg-card">
      <div className="flex items-center justify-between gap-2 border-b border-border p-3">
        <p className="text-sm font-semibold">Channels</p>
        <Button size="sm" variant="outline">
          New
        </Button>
      </div>

      <div className="flex flex-col gap-1 p-2">
        {items.map((c) => (
          <Link
            key={c.id}
            href={`/chat/${c.id}`}
            className={cn(
              'flex items-center justify-between gap-2 rounded-md px-2 py-2 text-sm transition-colors',
              c.isActive
                ? 'bg-muted text-foreground dark:bg-muted dark:text-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground dark:text-muted-foreground dark:hover:bg-muted dark:hover:text-foreground'
            )}
          >
            <span className="min-w-0 flex-1 truncate">{c.isDm ? c.name : `# ${c.name}`}</span>
            {c.unreadCount && c.unreadCount > 0 ? (
              <Badge variant="secondary">{c.unreadCount}</Badge>
            ) : null}
          </Link>
        ))}
      </div>
    </aside>
  );
}
