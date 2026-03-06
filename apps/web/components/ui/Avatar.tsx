'use client';

import * as React from 'react';
import Image from 'next/image';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const avatarVariants = cva('relative shrink-0 overflow-hidden rounded-full border border-border bg-muted', {
  variants: {
    size: {
      sm: 'h-7 w-7',
      md: 'h-9 w-9',
      lg: 'h-11 w-11',
    },
  },
  defaultVariants: { size: 'md' },
});

export type AvatarProps = {
  src?: string | null | undefined;
  alt: string;
  fallback: string;
  size?: VariantProps<typeof avatarVariants>['size'];
  className?: string;
};

export function Avatar({ src, alt, fallback, size, className }: AvatarProps): React.ReactElement {
  const initials = fallback
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <div className={cn(avatarVariants({ size }), className)}>
      {src ? (
        <Image src={src} alt={alt} fill className="object-cover" sizes="64px" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-muted-foreground">
          {initials}
        </div>
      )}
    </div>
  );
}
