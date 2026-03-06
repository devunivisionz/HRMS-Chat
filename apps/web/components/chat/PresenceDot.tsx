'use client';

import { cn } from '@/lib/utils';

export type PresenceStatus = 'online' | 'away' | 'offline';

export type PresenceDotProps = {
  status: PresenceStatus;
  className?: string;
};

export function PresenceDot({ status, className }: PresenceDotProps): React.ReactElement {
  const color =
    status === 'online'
      ? 'bg-success'
      : status === 'away'
        ? 'bg-warning'
        : 'bg-muted-foreground';

  return <span className={cn('inline-block h-2 w-2 rounded-full', color, className)} />;
}
