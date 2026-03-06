'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';

type ApiEnvelope<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };

type SearchRow = {
  id: string;
  channelId: string;
  senderId: string;
  content: string;
  createdAt: string;
};

type SearchResponse = {
  data: SearchRow[];
  nextCursor: string | null;
};

export type ChatSearchBarProps = {
  channelId?: string;
  onSelectMessage?: (params: { channelId: string; messageId: string }) => void;
};

export function ChatSearchBar({ channelId, onSelectMessage }: ChatSearchBarProps): React.ReactElement {
  const [q, setQ] = useState('');
  const trimmed = q.trim();
  const enabled = trimmed.length >= 2;

  const query = useQuery({
    queryKey: ['chat', 'search', { q: trimmed, channelId }],
    enabled,
    queryFn: async (): Promise<SearchRow[]> => {
      const params = new URLSearchParams();
      params.set('q', trimmed);
      if (channelId) params.set('channelId', channelId);
      params.set('limit', '20');

      const res = await api.get(`/chat/search?${params.toString()}`);
      const dataUnknown: unknown = res.data;
      if (typeof dataUnknown !== 'object' || dataUnknown === null) return [];
      const env = dataUnknown as ApiEnvelope<SearchResponse>;
      if (!('success' in env) || env.success !== true) return [];
      return env.data.data;
    },
  });

  const items = useMemo(() => query.data ?? [], [query.data]);

  const clear = (): void => {
    setQ('');
  };

  return (
    <div className="relative w-full">
      <div className="flex w-full items-center gap-2">
        <Input
          value={q}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQ(e.target.value)}
          placeholder={channelId ? 'Search in this channel…' : 'Search messages…'}
        />
        <Button variant="outline" size="sm" onClick={clear} disabled={!q}>
          Clear
        </Button>
      </div>

      {enabled ? (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 overflow-hidden rounded-md border border-border bg-card shadow-lg">
          {query.isLoading ? (
            <div className="flex items-center gap-2 p-3 text-sm text-muted-foreground">
              <Spinner size="sm" /> Searching
            </div>
          ) : items.length === 0 ? (
            <div className="p-3 text-sm text-muted-foreground">No results</div>
          ) : (
            <div className="max-h-72 overflow-auto">
              {items.map((m: SearchRow) => (
                <button
                  key={m.id}
                  type="button"
                  className="flex w-full flex-col gap-1 border-b border-border px-3 py-2 text-left transition-colors hover:bg-muted dark:hover:bg-muted"
                  onClick={() => onSelectMessage?.({ channelId: m.channelId, messageId: m.id })}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-muted-foreground">{m.senderId}</span>
                    <span className="text-xs text-muted-foreground">{new Date(m.createdAt).toLocaleString()}</span>
                  </div>
                  <span className="line-clamp-2 text-sm text-foreground">{m.content}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
