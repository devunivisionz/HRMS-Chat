'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { api } from '@/lib/api';
import { ChatLayout } from '@/components/chat/ChatLayout';
import type { ChannelListItem } from '@/components/chat/ChannelList';

type ApiEnvelope<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };

type ChannelApiItem = {
  id: string;
  name: string;
  type: string;
  isPrivate: boolean;
  memberIds: string[];
  lastMessageAt: string | null;
  createdAt: string;
};

export function ChatPageShell(): React.ReactElement {
  const channelsQuery = useQuery({
    queryKey: ['chat', 'channels'],
    queryFn: async (): Promise<ChannelListItem[]> => {
      const res = await api.get('/chat/channels?page=1&limit=50');
      const dataUnknown: unknown = res.data;

      if (typeof dataUnknown !== 'object' || dataUnknown === null) return [];
      const env = dataUnknown as ApiEnvelope<{ data: ChannelApiItem[] }>;
      if (!('success' in env) || env.success !== true) return [];

      return env.data.data.map((c) => ({
        id: c.id,
        name: c.name,
        type: c.type,
        isDm: c.type === 'dm',
        isActive: false,
      }));
    },
  });

  const channels: ChannelListItem[] = useMemo(
    () => channelsQuery.data ?? [],
    [channelsQuery.data]
  );

  return (
    <ChatLayout channels={channels}>
      <div className="flex min-h-0 flex-1 items-center justify-center p-6">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-semibold">Select a channel</h1>
          <p className="mt-2 text-sm text-muted-foreground">Pick a channel on the left to start chatting.</p>
        </div>
      </div>
    </ChatLayout>
  );
}
