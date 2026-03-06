'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';

import { createSupabaseBrowserClient } from '@/lib/supabase';

type SocketApi = {
  socket: Socket | null;
  isConnected: boolean;
  on: <T>(event: string, cb: (payload: T) => void) => void;
  emit: <T>(event: string, payload: T) => void;
};

function wait(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export function useSocket(): SocketApi {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const baseUrl = process.env.NEXT_PUBLIC_SOCKET_URL;

  const connect = useMemo(() => {
    return async (): Promise<void> => {
      if (!baseUrl) return;

      const supabase = createSupabaseBrowserClient();
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) return;

      const s = io(`${baseUrl}/chat`, {
        transports: ['websocket'],
        auth: { token },
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 500,
        reconnectionDelayMax: 10_000,
      });

      socketRef.current = s;

      s.on('connect', () => setIsConnected(true));
      s.on('disconnect', () => setIsConnected(false));
    };
  }, [baseUrl]);

  useEffect(() => {
    let isMounted = true;

    const run = async (): Promise<void> => {
      let attempt = 0;
      while (isMounted && !socketRef.current) {
        try {
          await connect();
          if (socketRef.current) return;
        } catch {
          // ignore
        }

        attempt += 1;
        const delay = Math.min(500 * 2 ** attempt, 10_000);
        await wait(delay);
      }
    };

    void run();

    return () => {
      isMounted = false;
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [connect]);

  return {
    socket: socketRef.current,
    isConnected,
    on: (event, cb) => {
      socketRef.current?.on(event, cb as unknown as (...args: unknown[]) => void);
    },
    emit: (event, payload) => {
      socketRef.current?.emit(event, payload);
    },
  };
}
