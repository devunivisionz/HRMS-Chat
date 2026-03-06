'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  hasError?: boolean;
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, hasError, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          'flex h-9 w-full rounded-md border bg-background px-3 py-1 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 dark:bg-background dark:text-foreground',
          hasError
            ? 'border-destructive focus-visible:ring-destructive dark:border-destructive dark:focus-visible:ring-destructive'
            : 'border-border focus-visible:ring-ring dark:border-border dark:focus-visible:ring-ring',
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';
