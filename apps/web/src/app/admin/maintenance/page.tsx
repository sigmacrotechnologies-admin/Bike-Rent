'use client';

import { useQuery } from '@tanstack/react-query';
import { maintenanceService } from '@/services';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/utils/cn';

export default function MaintenancePage() {
  const { data, isLoading } = useQuery({
    queryKey: ['maintenance'],
    queryFn: () => maintenanceService.list().then((r) => r.data),
  });

  const records = data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold">Maintenance Management</h1>
        <Button>Schedule Maintenance</Button>
      </div>
      <Card>
        <CardHeader><CardTitle>Maintenance Records</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-40 animate-pulse rounded bg-muted/20" />
          ) : records.length === 0 ? (
            <p className="text-muted-foreground">No maintenance records.</p>
          ) : (
            records.map((r: { _id: string; title: string; type: string; status: string; scheduledDate: string; vehicle?: { name: string } }) => (
              <div key={r._id} className="flex items-center justify-between border-b border-border/20 py-4">
                <div>
                  <p className="font-medium">{r.title}</p>
                  <p className="text-sm text-muted-foreground">{r.vehicle?.name} · {formatDate(r.scheduledDate)}</p>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline">{r.type}</Badge>
                  <Badge>{r.status}</Badge>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
