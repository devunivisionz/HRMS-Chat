'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { api } from '@/lib/api';
import { createSupabaseBrowserClient } from '@/lib/supabase';

type UsePushSubscriptionApi = {
  permission: NotificationPermission;
  isSubscribed: boolean;
  subscribe: () => Promise<void>;
  needsIosInstallPrompt: boolean;
};

function isIos(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  const nav = window.navigator as unknown as { standalone?: boolean };
  return window.matchMedia('(display-mode: standalone)').matches || nav.standalone === true;
}

async function urlBase64ToUint8Array(base64String: string): Promise<Uint8Array> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushSubscription(): UsePushSubscriptionApi {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [isSubscribed, setIsSubscribed] = useState(false);

  const needsIosInstallPrompt = useMemo(() => isIos() && !isStandalone(), []);

  useEffect(() => {
    setPermission(typeof Notification !== 'undefined' ? Notification.permission : 'default');
  }, []);

  const subscribe = useCallback(async (): Promise<void> => {
    // MUST be called inside a user gesture handler.
    if (typeof window === 'undefined') return;

    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) throw new Error('NEXT_PUBLIC_VAPID_PUBLIC_KEY is not set');

    const nextPerm = await Notification.requestPermission();
    setPermission(nextPerm);
    if (nextPerm !== 'granted') return;

    const reg = await navigator.serviceWorker.ready;

    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: await urlBase64ToUint8Array(vapidKey),
    });

    const supabase = createSupabaseBrowserClient();
    const { data } = await supabase.auth.getSession();
    if (!data.session) return;

    await api.post('/notifications/subscribe', {
      subscription: sub.toJSON(),
      platform: needsIosInstallPrompt ? 'ios' : 'web',
      userAgent: navigator.userAgent,
    });

    setIsSubscribed(true);
  }, [needsIosInstallPrompt]);

  return { permission, isSubscribed, subscribe, needsIosInstallPrompt };
}
