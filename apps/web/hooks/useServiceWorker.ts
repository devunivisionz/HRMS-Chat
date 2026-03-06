'use client';

import { useEffect, useState } from 'react';

import { api } from '@/lib/api';

async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;
  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    return registration;
  } catch {
    return null;
  }
}

async function subscribeToPush(registration: ServiceWorkerRegistration): Promise<PushSubscription | null> {
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidPublicKey) return null;

  try {
    const existing = await registration.pushManager.getSubscription();
    if (existing) return existing;

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: vapidPublicKey,
    });

    await api.post('/notifications/subscribe', {
      subscription: subscription.toJSON(),
      platform: 'web',
      userAgent: navigator.userAgent,
    });

    return subscription;
  } catch {
    return null;
  }
}

type UseServiceWorkerReturn = {
  isSupported: boolean;
  registration: ServiceWorkerRegistration | null;
  subscription: PushSubscription | null;
  subscribe: () => Promise<void>;
};

export function useServiceWorker(): UseServiceWorkerReturn {
  const [isSupported, setIsSupported] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);

  useEffect(() => {
    setIsSupported('serviceWorker' in navigator);

    const run = async (): Promise<void> => {
      const reg = await registerServiceWorker();
      if (!reg) return;
      setRegistration(reg);

      const sub = await reg.pushManager.getSubscription();
      if (sub) setSubscription(sub);
    };

    void run();
  }, []);

  const subscribe = async (): Promise<void> => {
    if (!registration) return;
    const sub = await subscribeToPush(registration);
    if (sub) setSubscription(sub);
  };

  return { isSupported, registration, subscription, subscribe };
}
