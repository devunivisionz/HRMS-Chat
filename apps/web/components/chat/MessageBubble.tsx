'use client';

import { useMemo } from 'react';

import { Avatar } from '@/components/ui/Avatar';
import { cn } from '@/lib/utils';

export type ChatMessage = {
  id: string;
  channelId: string;
  senderId: string;
  senderName: string;
  senderAvatarUrl?: string | null;
  createdAt: string;
  content: string;
  isMine: boolean;
  threadCount?: number;
};

export type MessageBubbleProps = {
  message: ChatMessage;
};

export function MessageBubble({ message }: MessageBubbleProps): React.ReactElement {
  const time = useMemo(() => {
    const d = new Date(message.createdAt);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, [message.createdAt]);

  return (
    <div className={cn('group flex gap-2', message.isMine ? 'justify-end' : 'justify-start')}>
      {!message.isMine ? (
        <Avatar src={message.senderAvatarUrl ?? null} alt={message.senderName} fallback={message.senderName} size="sm" />
      ) : null}

      <div className={cn('max-w-[75%] rounded-lg border border-border px-3 py-2', message.isMine ? 'bg-primary text-primary-foreground' : 'bg-card text-card-foreground')}>
        {!message.isMine ? <p className="text-xs font-medium opacity-90">{message.senderName}</p> : null}
        <p className="whitespace-pre-wrap break-words text-sm">{message.content}</p>
        <div className="mt-1 flex items-center justify-between gap-3">
          <p className={cn('text-[11px] opacity-70', message.isMine ? 'text-primary-foreground' : 'text-muted-foreground')}>{time}</p>
          {typeof message.threadCount === 'number' && message.threadCount > 0 ? (
            <p className={cn('text-[11px] opacity-70', message.isMine ? 'text-primary-foreground' : 'text-muted-foreground')}>
              {message.threadCount} thread
            </p>
          ) : null}
        </div>

        {message.isMine ? (
          <div className="mt-2 hidden items-center gap-2 group-hover:flex">
            <button className="text-[11px] underline-offset-4 hover:underline" type="button">
              Edit
            </button>
            <button className="text-[11px] underline-offset-4 hover:underline" type="button">
              Delete
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
