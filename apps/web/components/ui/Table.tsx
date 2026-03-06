'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';

export function Table({ className, ...props }: React.HTMLAttributes<HTMLTableElement>): React.ReactElement {
  return <table className={cn('w-full caption-bottom text-sm', className)} {...props} />;
}

export function TableHeader({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>): React.ReactElement {
  return <thead className={cn('[&_tr]:border-b [&_tr]:border-border', className)} {...props} />;
}

export function TableBody({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>): React.ReactElement {
  return <tbody className={cn('[&_tr:last-child]:border-0', className)} {...props} />;
}

export function TableRow({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>): React.ReactElement {
  return (
    <tr
      className={cn(
        'border-b border-border transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted dark:border-border dark:hover:bg-muted/50',
        className
      )}
      {...props}
    />
  );
}

export function TableHead({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>): React.ReactElement {
  return (
    <th
      className={cn(
        'h-10 px-2 text-left align-middle font-medium text-muted-foreground dark:text-muted-foreground',
        className
      )}
      {...props}
    />
  );
}

export function TableCell({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>): React.ReactElement {
  return <td className={cn('p-2 align-middle', className)} {...props} />;
}
