'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import type { RealtimeChannel } from '@supabase/supabase-js';

import { createSupabaseBrowserClient } from '@/lib/supabase';

type PresenceStatus = 'online' | 'offline' | 'away';

type PresenceMap = Record<string, PresenceStatus>;

type PresenceApi = {
  presenceMap: PresenceMap;
  setStatus: (status: Exclude<PresenceStatus, 'offline'>) => Promise<void>;
};

export function usePresence(): PresenceApi {
  const [presenceMap, setPresenceMap] = useState<PresenceMap>({});

  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  useEffect(() => {
    let channel: RealtimeChannel | null = null;

    const run = async (): Promise<void> => {
      const { data } = await supabase.auth.getSession();
      const userId = data.session?.user.id;
      if (!userId) return;

      channel = supabase.channel('presence:global', {
        config: { presence: { key: userId } },
      });

      channel
        .on('presence', { event: 'sync' }, () => {
          const state = channel?.presenceState() ?? {};
          const next: PresenceMap = {};
          for (const [key, value] of Object.entries(state)) {
            next[key] = Array.isArray(value) && value.length > 0 ? 'online' : 'offline';
          }
          setPresenceMap(next);
        })
        .on('presence', { event: 'join' }, ({ key }) => {
          setPresenceMap((m) => ({ ...m, [String(key)]: 'online' }));
        })
        .on('presence', { event: 'leave' }, ({ key }) => {
          setPresenceMap((m) => ({ ...m, [String(key)]: 'offline' }));
        });

      await channel.subscribe(async (status) => {
        if (status !== 'SUBSCRIBED') return;
        await channel?.track({ status: 'online' });
      });
    };

    void run();

    return () => {
      void channel?.unsubscribe();
    };
  }, [supabase]);

  const setStatus = useCallback(
    async (status: Exclude<PresenceStatus, 'offline'>): Promise<void> => {
      const channels = supabase.getChannels();
      const ch = channels.find((c) => c.topic === 'presence:global');
      if (!ch) return;
      await ch.track({ status });
    },
    [supabase]
  );

  return { presenceMap, setStatus };
}
