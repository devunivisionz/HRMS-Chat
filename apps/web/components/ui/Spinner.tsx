'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const spinnerVariants = cva('animate-spin', {
  variants: {
    size: {
      sm: 'h-4 w-4',
      md: 'h-5 w-5',
      lg: 'h-6 w-6',
    },
  },
  defaultVariants: { size: 'md' },
});

export type SpinnerProps = React.SVGAttributes<SVGSVGElement> & VariantProps<typeof spinnerVariants>;

export function Spinner({ className, size, ...props }: SpinnerProps): React.ReactElement {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn(spinnerVariants({ size }), 'text-muted-foreground dark:text-muted-foreground', className)}
      fill="none"
      {...props}
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        d="M4 12a8 8 0 018-8"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}
