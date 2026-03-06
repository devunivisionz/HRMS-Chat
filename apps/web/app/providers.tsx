'use client';

import { ThemeProvider } from 'next-themes';
import { QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { Toaster } from 'sonner';

import { createQueryClient } from '@/lib/queryClient';
import { PushPrompt } from '@/components/PushPrompt';

type ProvidersProps = {
  children: React.ReactNode;
};

export function Providers({ children }: ProvidersProps): React.ReactElement {
  const [queryClient] = useState(() => createQueryClient());

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster richColors closeButton />
        <PushPrompt />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
