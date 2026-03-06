'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import Link from 'next/link';

import { api } from '@/lib/api';
import { useSocket } from '@/hooks/useSocket';
import { Button } from '@/components/ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { ChatLayout } from '@/components/chat/ChatLayout';
import { ChatSearchBar } from '@/components/chat/ChatSearchBar';
import { MessageInput } from '@/components/chat/MessageInput';
import { MessageList } from '@/components/chat/MessageList';
import type { ChatMessage } from '@/components/chat/MessageBubble';
import type { ChannelListItem } from '@/components/chat/ChannelList';

type ApiEnvelope<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };

type ChannelMessagesResponse = {
  items: Array<{
    id: string;
    channelId: string;
    senderId: string;
    senderName: string;
    createdAt: string;
    content: string;
  }>;
};

type MessageRow = {
  id: string;
  channelId: string;
  senderId: string;
  content: string;
  createdAt: string;
};

type ChannelApiItem = {
  id: string;
  name: string;
  type: string;
};

function buildOptimisticMessage(params: {
  channelId: string;
  content: string;
  me: { id: string; name: string };
}): ChatMessage {
  return {
    id: `optimistic_${Math.random().toString(16).slice(2)}`,
    channelId: params.channelId,
    senderId: params.me.id,
    senderName: params.me.name,
    createdAt: new Date().toISOString(),
    content: params.content,
    isMine: true,
  };
}

export default function ChannelPage(): React.ReactElement {
  const params = useParams<{ channelId: string }>();
  const channelId = params.channelId;

  const { socket, isConnected } = useSocket();

  const me = useMemo(() => ({ id: 'me', name: 'You' }), []);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typingNames, setTypingNames] = useState<string[]>([]);
  const [scrollKey, setScrollKey] = useState<number>(0);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

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
        isActive: c.id === channelId,
        isDm: c.type === 'dm',
      }));
    },
  });

  const channels: ChannelListItem[] = useMemo(
    () => channelsQuery.data ?? [],
    [channelsQuery.data]
  );

  const messagesQuery = useQuery({
    queryKey: ['chat', 'messages', channelId],
    enabled: Boolean(channelId),
    queryFn: async (): Promise<{ messages: ChatMessage[]; nextCursor: string | null }> => {
      const res = await api.get(`/chat/messages?channelId=${channelId}&limit=50`);
      const dataUnknown: unknown = res.data;

      if (typeof dataUnknown !== 'object' || dataUnknown === null) return { messages: [], nextCursor: null };
      const env = dataUnknown as ApiEnvelope<{ data: MessageRow[]; nextCursor: string | null }>;
      if (!('success' in env) || env.success !== true) return { messages: [], nextCursor: null };
      const items = env.data.data;
      const cursor = env.data.nextCursor;

      const mapped = items.map((m) => ({
        id: m.id,
        channelId: m.channelId,
        senderId: m.senderId,
        senderName: m.senderId,
        createdAt: m.createdAt,
        content: m.content,
        isMine: m.senderId === me.id,
      }));

      return { messages: mapped, nextCursor: cursor };
    },
  });

  useEffect(() => {
    const data = messagesQuery.data;
    if (!data) return;
    setMessages(data.messages);
    setNextCursor(data.nextCursor);
    setScrollKey((k) => k + 1);
  }, [messagesQuery.data]);

  useEffect(() => {
    if (!socket) return;

    const onNew = (payload: unknown): void => {
      if (typeof payload !== 'object' || payload === null) return;
      const p = payload as Record<string, unknown>;
      if (p.channelId !== channelId) return;

      const id = p.id;
      const senderId = p.senderId;
      const senderName = p.senderName;
      const createdAt = p.createdAt;
      const content = p.content;

      if (typeof id !== 'string') return;
      if (typeof senderId !== 'string') return;
      if (typeof senderName !== 'string') return;
      if (typeof createdAt !== 'string') return;
      if (typeof content !== 'string') return;

      const next: ChatMessage = {
        id,
        channelId,
        senderId,
        senderName,
        createdAt,
        content,
        isMine: senderId === me.id,
      };

      setMessages((prev) => [...prev, next]);
      setScrollKey((k) => k + 1);
    };

    socket.on('message:new', onNew);
    return () => {
      socket.off('message:new', onNew);
    };
  }, [channelId, me.id, socket]);

  const sendMutation = useMutation({
    mutationFn: async (content: string): Promise<void> => {
      if (!socket || !isConnected) throw new Error('Socket not connected');

      await new Promise<void>((resolve, reject) => {
        socket.timeout(5000).emit(
          'message:send',
          { channelId, content },
          (err: unknown, ack: unknown) => {
            if (err) {
              reject(new Error('Send timeout'));
              return;
            }
            if (typeof ack !== 'object' || ack === null) {
              resolve();
              return;
            }
            const ok = (ack as Record<string, unknown>).ok;
            if (ok === false) {
              reject(new Error('Send failed'));
              return;
            }
            resolve();
          }
        );
      });
    },
  });

  const onSend = async (content: string): Promise<void> => {
    const optimistic = buildOptimisticMessage({ channelId, content, me });
    setMessages((prev) => [...prev, optimistic]);
    setScrollKey((k) => k + 1);

    try {
      await sendMutation.mutateAsync(content);
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
    }
  };

  useEffect(() => {
    if (!socket) return;

    const onTyping = (payload: unknown): void => {
      if (typeof payload !== 'object' || payload === null) return;
      const p = payload as Record<string, unknown>;
      if (p.channelId !== channelId) return;
      const userId = p.userId;
      const isTyping = p.isTyping;
      if (typeof userId !== 'string') return;
      if (typeof isTyping !== 'boolean') return;

      const name = userId.length > 8 ? `${userId.slice(0, 8)}…` : userId;

      setTypingNames((prev) => {
        const has = prev.includes(name);
        if (isTyping && !has) return [...prev, name];
        if (!isTyping && has) return prev.filter((n) => n !== name);
        return prev;
      });
    };

    socket.on('typing:update', onTyping);
    return () => {
      socket.off('typing:update', onTyping);
    };
  }, [channelId, socket]);

  return (
    <ChatLayout channels={channels}>
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex flex-col gap-3 border-b border-border bg-card px-4 py-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="md:hidden">
                  Channels
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {channels.map((c: ChannelListItem) => (
                  <DropdownMenuItem key={c.id} asChild>
                    <Link href={`/chat/${c.id}`} className="flex items-center justify-between">
                      <span className="truncate">{c.isDm ? c.name : `# ${c.name}`}</span>
                      {c.isActive && <span className="ml-2 h-2 w-2 rounded-full bg-primary" />}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <p className="text-sm font-semibold">#{channelId}</p>
          </div>
          <div className="w-full md:max-w-md">
            <ChatSearchBar channelId={channelId} />
          </div>
        </div>

        <MessageList messages={messages} typingNames={typingNames} scrollToBottomKey={scrollKey} />
        <MessageInput onSend={onSend} placeholder={`Message #${channelId}`} />
      </div>
    </ChatLayout>
  );
}
