'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default:
          'border-border bg-muted text-foreground dark:border-border dark:bg-muted dark:text-foreground',
        secondary:
          'border-border bg-secondary text-secondary-foreground dark:border-border dark:bg-secondary dark:text-secondary-foreground',
        destructive:
          'border-destructive bg-destructive text-destructive-foreground dark:border-destructive dark:bg-destructive dark:text-destructive-foreground',
        outline:
          'border-border bg-transparent text-foreground dark:border-border dark:text-foreground',
        success:
          'border-border bg-muted text-success dark:border-border dark:bg-muted dark:text-success',
        warning:
          'border-border bg-muted text-warning dark:border-border dark:bg-muted dark:text-warning',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>;

export function Badge({ className, variant, ...props }: BadgeProps): React.ReactElement {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
