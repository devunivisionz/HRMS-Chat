'use client';

import { useMemo } from 'react';

export type TypingIndicatorProps = {
  names: string[];
};

export function TypingIndicator({ names }: TypingIndicatorProps): React.ReactElement {
  const label = useMemo(() => {
    if (names.length === 0) return '';
    if (names.length === 1) return `${names[0]} is typing…`;
    if (names.length === 2) return `${names[0]} and ${names[1]} are typing…`;
    return `${names[0]} and ${names.length - 1} others are typing…`;
  }, [names]);

  if (!label) return <div className="h-6" />;

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <span>{label}</span>
      <span className="inline-flex gap-1">
        <span className="h-1 w-1 animate-bounce rounded-full bg-muted-foreground [animation-delay:0ms]" />
        <span className="h-1 w-1 animate-bounce rounded-full bg-muted-foreground [animation-delay:150ms]" />
        <span className="h-1 w-1 animate-bounce rounded-full bg-muted-foreground [animation-delay:300ms]" />
      </span>
    </div>
  );
}
