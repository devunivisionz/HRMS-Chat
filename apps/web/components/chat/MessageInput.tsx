'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export type MessageInputProps = {
  onSend: (content: string) => Promise<void>;
  placeholder?: string;
};

export function MessageInput({ onSend, placeholder }: MessageInputProps): React.ReactElement {
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const taRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = '0px';
    el.style.height = `${Math.min(160, el.scrollHeight)}px`;
  }, [value]);

  const canSend = useMemo(() => value.trim().length > 0 && !busy, [busy, value]);

  const send = async (): Promise<void> => {
    const content = value.trim();
    if (!content) return;
    setBusy(true);
    try {
      await onSend(content);
      setValue('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="border-t border-border bg-card p-3">
      <div className="flex items-end gap-2">
        <button
          type="button"
          className="h-9 w-9 rounded-md border border-border bg-background text-sm text-foreground hover:bg-muted dark:bg-background"
          aria-label="Upload file"
        >
          +
        </button>

        <textarea
          ref={taRef}
          className={cn(
            'min-h-9 flex-1 resize-none rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring dark:bg-background',
            busy ? 'opacity-70' : ''
          )}
          placeholder={placeholder ?? 'Message…'}
          value={value}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setValue(e.target.value)}
          onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
        />

        <Button onClick={() => void send()} disabled={!canSend}>
          Send
        </Button>
      </div>
      <div className="mt-2 text-xs text-muted-foreground">
        Enter to send
        <span className="mx-1">•</span>
        Shift+Enter for newline
      </div>
    </div>
  );
}
