'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export type LeaveBalanceCardProps = {
  typeName: string;
  allocated: number;
  used: number;
};

export function LeaveBalanceCard({ typeName, allocated, used }: LeaveBalanceCardProps): React.ReactElement {
  const remaining = Math.max(0, allocated - used);
  const pct = allocated <= 0 ? 0 : Math.min(100, Math.round((used / allocated) * 100));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{typeName}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Used</span>
          <span className="font-medium text-foreground">{used}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Remaining</span>
          <span className="font-medium text-foreground">{remaining}</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
        </div>
      </CardContent>
    </Card>
  );
}
