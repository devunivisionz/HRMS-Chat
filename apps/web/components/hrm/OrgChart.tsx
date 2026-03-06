'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export type OrgChartNode = {
  id: string;
  name: string;
  title: string;
  reports?: OrgChartNode[];
};

export type OrgChartProps = {
  root: OrgChartNode;
};

function OrgChartNodeView({ node }: { node: OrgChartNode }): React.ReactElement {
  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-md border border-border bg-background p-3">
        <p className="text-sm font-medium text-foreground">{node.name}</p>
        <p className="text-xs text-muted-foreground">{node.title}</p>
      </div>

      {node.reports && node.reports.length > 0 ? (
        <div className="ml-4 flex flex-col gap-3 border-l border-border pl-4">
          {node.reports.map((r) => (
            <div key={r.id}>
              <OrgChartNodeView node={r} />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function OrgChart({ root }: OrgChartProps): React.ReactElement {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Org chart</CardTitle>
      </CardHeader>
      <CardContent>
        <OrgChartNodeView node={root} />
      </CardContent>
    </Card>
  );
}
