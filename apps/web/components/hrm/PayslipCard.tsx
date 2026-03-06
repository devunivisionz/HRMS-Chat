'use client';

import { useMutation } from '@tanstack/react-query';

import { createSupabaseBrowserClient } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export type PayslipCardProps = {
  monthLabel: string;
  year: number;
  netPay: string;
  storagePath: string;
};

export function PayslipCard({ monthLabel, year, netPay, storagePath }: PayslipCardProps): React.ReactElement {
  const downloadMutation = useMutation({
    mutationFn: async (): Promise<void> => {
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase.storage.from('payslips').createSignedUrl(storagePath, 60);
      if (error) throw error;
      const url = data.signedUrl;
      window.open(url, '_blank', 'noopener,noreferrer');
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {monthLabel} {year}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs text-muted-foreground">Net pay</p>
          <p className="text-lg font-semibold">{netPay}</p>
        </div>
        <Button onClick={() => downloadMutation.mutate()} disabled={downloadMutation.isPending}>
          {downloadMutation.isPending ? 'Preparing…' : 'Download'}
        </Button>
      </CardContent>
    </Card>
  );
}
