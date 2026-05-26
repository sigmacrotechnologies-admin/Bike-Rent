'use client';

import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '@/services';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AnalyticsPage() {
  const { data } = useQuery({
    queryKey: ['analytics-reports'],
    queryFn: () => analyticsService.dashboard().then((r) => r.data.data),
  });

  const bookingsByStatus = data?.bookingsByStatus || {};

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold">Analytics & Reports</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Object.entries(bookingsByStatus).map(([status, count]) => (
          <Card key={status}>
            <CardHeader><CardTitle className="capitalize">{status.replace('_', ' ')}</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-bold text-electric-500">{count as number}</p></CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
