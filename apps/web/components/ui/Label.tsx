'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';

export type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement> & {
  required?: boolean;
};

export function Label({ className, children, required, ...props }: LabelProps): React.ReactElement {
  return (
    <label className={cn('text-sm font-medium text-foreground dark:text-foreground', className)} {...props}>
      {children}
      {required ? <span className="ml-1 text-destructive dark:text-destructive">*</span> : null}
    </label>
  );
}
