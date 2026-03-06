'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import type { RealtimeChannel } from '@supabase/supabase-js';
import type { Notification } from '@hrms/types';

import { api } from '@/lib/api';
import { createSupabaseBrowserClient } from '@/lib/supabase';

type NotificationsApi = {
  unreadCount: number;
  notifications: Notification[];
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
};

export function useNotifications(): NotificationsApi {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  useEffect(() => {
    let channel: RealtimeChannel | null = null;

    const run = async (): Promise<void> => {
      const { data } = await supabase.auth.getSession();
      const userId = data.session?.user.id;
      if (!userId) return;

      channel = supabase.channel(`notifications:${userId}`);

      channel.on('broadcast', { event: 'INSERT' }, (payload) => {
        const raw = payload.payload as unknown;
        if (!raw || typeof raw !== 'object') return;

        const n = raw as Notification;

        setNotifications((prev) => [n, ...prev].slice(0, 50));
        if (!n.isRead) setUnreadCount((c) => c + 1);
        toast(n.title, { description: n.body });
      });

      await channel.subscribe();
    };

    void run();

    return () => {
      void channel?.unsubscribe();
    };
  }, [supabase]);

  const markRead = useCallback(async (id: string): Promise<void> => {
    await api.patch(`/notifications/${id}/read`);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
  }, []);

  const markAllRead = useCallback(async (): Promise<void> => {
    await api.patch('/notifications/read-all');
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  }, []);

  return { unreadCount, notifications, markRead, markAllRead };
}
