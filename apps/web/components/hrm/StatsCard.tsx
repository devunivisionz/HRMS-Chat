'use client';

import { Card, CardContent } from '@/components/ui/Card';

export type StatsCardProps = {
  icon?: React.ReactNode;
  label: string;
  value: string;
  trend?: {
    direction: 'up' | 'down';
    value: string;
  };
};

export function StatsCard({ icon, label, value, trend }: StatsCardProps): React.ReactElement {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-muted text-foreground">
          {icon ?? <span className="text-sm font-semibold">{label.slice(0, 1).toUpperCase()}</span>}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs text-muted-foreground">{label}</p>
          <p className="truncate text-lg font-semibold">{value}</p>
        </div>
        {trend ? (
          <div className="text-right">
            <p
              className={
                trend.direction === 'up'
                  ? 'text-sm font-medium text-success dark:text-success'
                  : 'text-sm font-medium text-destructive dark:text-destructive'
              }
            >
              {trend.direction === 'up' ? '+' : '-'}
              {trend.value}
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
