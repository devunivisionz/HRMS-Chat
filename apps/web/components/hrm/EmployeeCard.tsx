'use client';

import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';

export type EmployeeStatus = 'active' | 'inactive' | 'on_leave';

export type EmployeeCardProps = {
  employee: {
    id: string;
    name: string;
    designation: string;
    department: string;
    status: EmployeeStatus;
    avatarUrl?: string | null;
  };
};

function statusVariant(status: EmployeeStatus): 'success' | 'warning' | 'secondary' {
  if (status === 'active') return 'success';
  if (status === 'on_leave') return 'warning';
  return 'secondary';
}

function statusLabel(status: EmployeeStatus): string {
  if (status === 'active') return 'Active';
  if (status === 'on_leave') return 'On leave';
  return 'Inactive';
}

export function EmployeeCard({ employee }: EmployeeCardProps): React.ReactElement {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <Avatar src={employee.avatarUrl} alt={employee.name} fallback={employee.name} size="md" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{employee.name}</p>
          <p className="truncate text-xs text-muted-foreground">{employee.designation}</p>
          <p className="truncate text-xs text-muted-foreground">{employee.department}</p>
        </div>
        <Badge variant={statusVariant(employee.status)}>{statusLabel(employee.status)}</Badge>
      </CardContent>
    </Card>
  );
}
