'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';

export type SkeletonProps = React.HTMLAttributes<HTMLDivElement>;

export function Skeleton({ className, ...props }: SkeletonProps): React.ReactElement {
  return (
    <div
      className={cn(
        'animate-shimmer rounded-md bg-muted dark:bg-muted',
        className
      )}
      {...props}
    />
  );
}
