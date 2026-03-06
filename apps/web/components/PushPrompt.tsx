'use client';

import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';

import { useServiceWorker } from '@/hooks/useServiceWorker';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';

export function PushPrompt(): React.ReactElement | null {
  const { isSupported, subscription, subscribe } = useServiceWorker();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('push-prompt-dismissed');
    if (stored === '1') setDismissed(true);
  }, []);

  if (!isSupported || subscription || dismissed) return null;

  const handleEnable = async (): Promise<void> => {
    try {
      await subscribe();
      toast.success('Push notifications enabled');
    } catch {
      toast.error('Failed to enable push notifications');
    }
  };

  const handleDismiss = (): void => {
    localStorage.setItem('push-prompt-dismissed', '1');
    setDismissed(true);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex max-w-sm flex-col gap-3 rounded-lg border border-border bg-card p-4 shadow-lg">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <Bell className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <p className="font-medium">Enable push notifications?</p>
          <p className="text-sm text-muted-foreground">Get notified about important updates and messages.</p>
        </div>
      </div>
      <div className="flex items-center justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={handleDismiss}>
          Not now
        </Button>
        <Button size="sm" onClick={handleEnable}>
          Enable
        </Button>
      </div>
    </div>
  );
}
