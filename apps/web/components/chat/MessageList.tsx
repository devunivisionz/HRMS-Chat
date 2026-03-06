'use client';

import { useEffect, useMemo, useRef } from 'react';

import { MessageBubble, type ChatMessage } from '@/components/chat/MessageBubble';
import { TypingIndicator } from '@/components/chat/TypingIndicator';

export type MessageListProps = {
  messages: ChatMessage[];
  typingNames: string[];
  scrollToBottomKey: number;
};

function dayKey(iso: string): string {
  const d = new Date(iso);
  return d.toDateString();
}

export function MessageList({ messages, typingNames, scrollToBottomKey }: MessageListProps): React.ReactElement {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [scrollToBottomKey]);

  const grouped = useMemo(() => {
    const groups: Array<{ key: string; items: ChatMessage[] }> = [];
    for (const m of messages) {
      const k = dayKey(m.createdAt);
      const last = groups[groups.length - 1];
      if (!last || last.key !== k) {
        groups.push({ key: k, items: [m] });
      } else {
        last.items.push(m);
      }
    }
    return groups;
  }, [messages]);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4">
      <div className="flex flex-col gap-3">
        {grouped.map((g: { key: string; items: ChatMessage[] }) => (
          <div key={g.key} className="flex flex-col gap-3">
            <div className="flex items-center justify-center">
              <span className="rounded-full border border-border bg-muted px-3 py-1 text-xs text-muted-foreground">
                {g.key}
              </span>
            </div>
            {g.items.map((m: ChatMessage) => (
              <div key={m.id}>
                <MessageBubble message={m} />
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="mt-4">
        <TypingIndicator names={typingNames} />
      </div>
      <div ref={bottomRef} />
    </div>
  );
}
